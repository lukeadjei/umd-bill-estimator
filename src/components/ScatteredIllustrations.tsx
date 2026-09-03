import Image from "next/image";

// Shared by any page that wants the same "loose sketches poking through the
// gaps" background language (currently the dashboard and the auth page) --
// same three homepage icons (not the McKeldin building, which is its own
// per-page corner placement, not part of this scatter), same jittered-degree
// rotation + three-tier opacity approach, so the two pages read as the same
// visual system instead of two different implementations that happen to
// look similar. Each page supplies its own `layout` (positions tuned to that
// page's own content shape) but shares this rendering logic.
const ICONS = {
  calculator: { src: "/illustrations/calculator.svg", w: 290, h: 430 },
  pencil: { src: "/illustrations/pencil.svg", w: 110, h: 630 },
  paper: { src: "/illustrations/paper.svg", w: 230, h: 340 },
} as const;
const OPACITY_TIERS = [0.14, 0.19, 0.24] as const;

export type ScatterIcon = keyof typeof ICONS;
export type ScatterItem = {
  icon: ScatterIcon;
  top: string;
  left: string;
  size: string;
  rotate: number;
};

export function ScatteredIllustrations({ layout }: { layout: readonly ScatterItem[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {layout.map((item, index) => {
        const icon = ICONS[item.icon];
        return (
          <Image
            key={index}
            src={icon.src}
            alt=""
            width={icon.w}
            height={icon.h}
            className={`absolute ${item.size}`}
            style={{
              top: item.top,
              left: item.left,
              transform: `rotate(${item.rotate}deg)`,
              opacity: OPACITY_TIERS[index % OPACITY_TIERS.length],
            }}
          />
        );
      })}
    </div>
  );
}
