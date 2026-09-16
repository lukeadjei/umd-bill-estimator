"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Same underlying primitive as Dialog/AlertDialog (@base-ui/react/dialog --
// gives focus trap, Escape-to-close, click-outside-to-close for free), but
// built directly here rather than through the shared DialogContent -- that
// one is styled as a small centered card (the note-prompt use case), and a
// full-bleed centered photo with a dark backdrop needs different styling
// entirely, not an override of the card look.
export function ImageLightbox({ urls, alt }: { urls: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (urls.length === 0) return null;

  function goPrev() {
    setIndex((current) => (current - 1 + urls.length) % urls.length);
  }
  function goNext() {
    setIndex((current) => (current + 1) % urls.length);
  }

  return (
    // Reset to the first photo every time the lightbox is (re)opened, not
    // wherever it was left last time -- opening should always start from
    // the same photo the thumbnail row is already showing.
    <DialogPrimitive.Root onOpenChange={(open) => open && setIndex(0)}>
      <DialogPrimitive.Trigger
        render={<Button type="button" variant="outline" size="sm" className="w-fit rounded-full" />}
      >
        <ExpandIcon className="size-4" />
        {urls.length > 1 ? "View more photos" : "Expand"}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/70 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <DialogPrimitive.Close
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 rounded-full text-white hover:bg-white/10 hover:text-white"
              />
            }
          >
            <XIcon className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="relative flex w-full items-center justify-center">
            {urls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={goPrev}
                aria-label="Previous photo"
              >
                <ChevronLeftIcon className="size-6" />
              </Button>
            )}

            <div className="relative h-[70vh] w-full overflow-hidden rounded-xl bg-black/20">
              <Image src={urls[index]} alt={alt} fill sizes="92vw" className="object-contain" />
            </div>

            {urls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={goNext}
                aria-label="Next photo"
              >
                <ChevronRightIcon className="size-6" />
              </Button>
            )}
          </div>

          {urls.length > 1 && (
            <p className="text-sm text-white/80">
              {index + 1} / {urls.length}
            </p>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
