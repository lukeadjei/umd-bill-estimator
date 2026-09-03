import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_ITEMS, type CategoryId } from "@/components/settings/categories";

// Only two categories, so it's a horizontal row on mobile and a vertical
// stack at md+ -- no scroll handling needed either way, unlike the
// dashboard's five-tab nav. orientation="vertical" on the Tabs primitive
// isn't just a style choice -- it switches base-ui's keyboard handling from
// left/right arrows to up/down, which matches the desktop layout even
// though mobile displays it as a row.
//
// The overrides below use the exact same `group-data-vertical/tabs:` prefix
// the base Tabs component uses internally (it bakes in flex-col/w-full/
// justify-start whenever orientation="vertical", regardless of viewport) --
// a plain `flex-row` without that prefix doesn't reliably win against it
// (same class of bug as the ChatOverlay/Sheet radius issue: a
// data-attribute-scoped base rule beats an unscoped override regardless of
// where it sits in the className string, since Tailwind's cascade order
// isn't the same as source order in the JSX).
export function SettingsNav({
  active,
  onChange,
}: {
  active: CategoryId;
  onChange: (category: CategoryId) => void;
}) {
  return (
    <Tabs
      value={active}
      onValueChange={(value) => onChange(value as CategoryId)}
      orientation="vertical"
      className="h-full"
    >
      <TabsList className="h-auto w-full items-stretch gap-1 rounded-none bg-transparent p-0 group-data-vertical/tabs:flex-row md:group-data-vertical/tabs:flex-col">
        {CATEGORY_ITEMS.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className="rounded-full px-4 py-2.5 text-center text-base font-semibold group-data-vertical/tabs:flex-1 group-data-vertical/tabs:justify-center data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm md:text-left md:group-data-vertical/tabs:w-full md:group-data-vertical/tabs:flex-none md:group-data-vertical/tabs:justify-start"
          >
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
