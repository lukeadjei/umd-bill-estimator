import { getHousingImages } from "@/lib/content/housingImages";
import type { AiTool } from "./types";

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

// Surfaces real dorm photos in the chat when a student asks about a specific
// room type or building category. Enums built dynamically from the live
// RatesBundle, same reasoning as setSelections -- the model should only ever
// be offered real, currently-selectable housing values.
export const getHousingPhotosTool: AiTool = {
  name: "getHousingPhotos",

  buildDefinition(rates) {
    const roomTypes = uniqueValues(rates.housingRates.map((r) => r.room_type));
    const buildingCategories = uniqueValues(rates.housingRates.map((r) => r.building_category));
    return {
      name: "getHousingPhotos",
      description:
        "Look up real photos for a housing room type and/or building category the student asked about. Provide at least one of roomType or buildingCategory.",
      parametersSchema: {
        type: "object",
        properties: {
          roomType: { type: "string", enum: roomTypes },
          buildingCategory: { type: "string", enum: buildingCategories },
        },
        required: [],
      },
    };
  },

  async execute(rawArgs) {
    if (typeof rawArgs !== "object" || rawArgs === null || Array.isArray(rawArgs)) {
      return { ok: false, errors: ["Tool call arguments must be a JSON object."] };
    }

    const { roomType, buildingCategory } = rawArgs as { roomType?: unknown; buildingCategory?: unknown };

    if (roomType === undefined && buildingCategory === undefined) {
      return { ok: false, errors: ["At least one of roomType or buildingCategory is required."] };
    }
    if (roomType !== undefined && typeof roomType !== "string") {
      return { ok: false, errors: ["roomType must be a string."] };
    }
    if (buildingCategory !== undefined && typeof buildingCategory !== "string") {
      return { ok: false, errors: ["buildingCategory must be a string."] };
    }

    // getHousingImages() already fails soft to an empty result on any
    // S3/config problem (see housingImages.ts) -- never throws. An empty
    // photos array is a legitimate result here (nothing on file for that
    // combination), not an error condition.
    const images = await getHousingImages();
    const photos = uniqueValues([
      ...(typeof roomType === "string" ? images.roomTypes[roomType] ?? [] : []),
      ...(typeof buildingCategory === "string" ? images.buildingCategories[buildingCategory] ?? [] : []),
    ]);

    return { ok: true, result: { photos } };
  },
};
