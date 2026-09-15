import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";

// See docs/BUILD-REFERENCE.md ("S3 bucket structure") for the full reference
// table and the reasoning behind it -- kept in sync with
// housingDescriptions.ts's keys on purpose, so a panel can look up
// descriptions and images off the exact same DB value.
const ROOM_TYPE_SLUGS: Record<string, string> = {
  Single: "single",
  "Single With Bath": "single-with-bath",
  Double: "double",
  "Double With Bath": "double-with-bath",
  "Converted Single": "converted-single",
  "Double Requires Bunked Beds": "double-requires-bunked-beds",
  "Triple or Quad": "triple-or-quad",
  "Triple or Quad With Bath": "triple-or-quad-with-bath",
};

// Traditional Without/With AC deliberately share one slug -- no visual
// difference between them, same call already made for their description text.
const BUILDING_CATEGORY_SLUGS: Record<string, string> = {
  "Traditional Without AC": "traditional",
  "Traditional With AC": "traditional",
  "New Traditional": "new-traditional",
  "Semi-Suite": "semi-suite",
  Suite: "suite",
  Apartment: "apartment",
};

export type HousingImages = {
  roomTypes: Record<string, string[]>;
  buildingCategories: Record<string, string[]>;
};

const EMPTY_HOUSING_IMAGES: HousingImages = { roomTypes: {}, buildingCategories: {} };

// One client, module-level -- not recreated per request/per folder.
function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_PHOTOS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_PHOTOS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_PHOTOS_SECRET_ACCESS_KEY!,
    },
  });
}

// Lists whatever's actually sitting under a folder prefix and turns each key
// into its public URL -- filenames are deliberately free-form (see
// BUILD-REFERENCE.md), so this never assumes a specific name, just "whatever
// is there right now." Sorted for a stable, deterministic order across
// requests/re-renders, not whatever order S3 happens to return.
async function listImageUrls(client: S3Client, bucket: string, region: string, prefix: string): Promise<string[]> {
  const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  const keys = (result.Contents ?? [])
    .map((object) => object.Key)
    .filter((key): key is string => Boolean(key) && !key!.endsWith("/"))
    .sort();
  return keys.map((key) => `https://${bucket}.s3.${region}.amazonaws.com/${key}`);
}

// Photos are decorative, not essential -- unlike rate data (where a missing
// value is a real bug calculateTotal throws on), a photo feature failing
// should never take the whole dashboard down with it. Any S3/config problem
// here is swallowed and surfaced as "no photos for anything," not a crash.
async function fetchHousingImages(): Promise<HousingImages> {
  const bucket = process.env.AWS_PHOTOS_BUCKET;
  const region = process.env.AWS_PHOTOS_REGION;
  if (!bucket || !region || !process.env.AWS_PHOTOS_ACCESS_KEY_ID || !process.env.AWS_PHOTOS_SECRET_ACCESS_KEY) {
    return EMPTY_HOUSING_IMAGES;
  }

  try {
    const client = getS3Client();

    // Dedupe by slug first (Traditional With/Without AC share one folder) so
    // that shared folder is only ever listed once, not fetched twice.
    const uniqueRoomTypeSlugs = Array.from(new Set(Object.values(ROOM_TYPE_SLUGS)));
    const uniqueBuildingCategorySlugs = Array.from(new Set(Object.values(BUILDING_CATEGORY_SLUGS)));

    const [roomTypeResults, buildingCategoryResults] = await Promise.all([
      Promise.all(uniqueRoomTypeSlugs.map((slug) => listImageUrls(client, bucket, region, `housing/room-types/${slug}/`))),
      Promise.all(
        uniqueBuildingCategorySlugs.map((slug) =>
          listImageUrls(client, bucket, region, `housing/building-categories/${slug}/`)
        )
      ),
    ]);

    const imagesBySlug = (slugs: string[], results: string[][]) =>
      Object.fromEntries(slugs.map((slug, index) => [slug, results[index]]));

    const roomTypeImagesBySlug = imagesBySlug(uniqueRoomTypeSlugs, roomTypeResults);
    const buildingCategoryImagesBySlug = imagesBySlug(uniqueBuildingCategorySlugs, buildingCategoryResults);

    return {
      roomTypes: Object.fromEntries(
        Object.entries(ROOM_TYPE_SLUGS).map(([dbValue, slug]) => [dbValue, roomTypeImagesBySlug[slug] ?? []])
      ),
      buildingCategories: Object.fromEntries(
        Object.entries(BUILDING_CATEGORY_SLUGS).map(([dbValue, slug]) => [dbValue, buildingCategoryImagesBySlug[slug] ?? []])
      ),
    };
  } catch {
    return EMPTY_HOUSING_IMAGES;
  }
}

// Cached the same way rates are (unstable_cache, 24h) -- photos change about
// as rarely as rates do, and this avoids a live S3 round trip (13 List calls)
// on every dashboard visit.
export const getHousingImages = unstable_cache(fetchHousingImages, ["housing-images"], {
  tags: ["housing-images"],
  revalidate: 86400,
});
