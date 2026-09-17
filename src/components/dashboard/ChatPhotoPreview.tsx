"use client";

import Image from "next/image";
import { ImageLightbox } from "@/components/dashboard/panels/ImageLightbox";

// Inline photo preview for the chat assistant's getHousingPhotos results.
// ImageLightbox by itself only renders a bare "Expand" / "View more photos"
// pill button (built for HousingPanel, which already shows a thumbnail row
// above it) -- dropped straight into a chat bubble with nothing else nearby,
// that reads as a plain text link with no visible photo. This shows the
// first photo itself, sized to sit comfortably inside a chat bubble (a
// smaller tile than HousingPanel's own h-32 w-48 gallery thumbnails, since
// a chat message is narrower than a full panel), with a small "+N more"
// badge when there's more than one. Clicking it opens the exact same
// full-screen lightbox (backdrop, prev/next, close) ImageLightbox already
// provides elsewhere, via its `trigger` prop -- no separate viewer here.
export function ChatPhotoPreview({ urls, alt }: { urls: string[]; alt: string }) {
  if (urls.length === 0) return null;

  const extraCount = urls.length - 1;

  return (
    <ImageLightbox
      urls={urls}
      alt={alt}
      trigger={
        <button
          type="button"
          className="group relative h-32 w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-foreground/10 transition hover:ring-foreground/30"
        >
          <Image
            src={urls[0]}
            alt={alt}
            fill
            sizes="160px"
            className="object-cover transition duration-150 group-hover:scale-105"
          />
          {extraCount > 0 && (
            <span className="absolute right-1.5 bottom-1.5 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
              +{extraCount} more
            </span>
          )}
        </button>
      }
    />
  );
}
