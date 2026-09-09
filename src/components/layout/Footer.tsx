import Link from "next/link";

export function Footer() {
  return (
    // print:hidden -- this renders on every page via the root layout, but a
    // "click here for our privacy policy" link is meaningless on a printed
    // page. The results page has its own unofficial-estimate disclaimer in
    // its printed header instead.
    <footer className="border-t px-6 py-8 text-sm text-muted-foreground print:hidden md:px-12">
      <p>
        UMD Bill Estimator is an unofficial, student-built project. It is not affiliated with, endorsed by, or
        sponsored by the University of Maryland.
      </p>
      <p className="mt-2">
        We only store the selections you choose to save to an account. Read our{" "}
        <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
          privacy &amp; data policy
        </Link>{" "}
        for details.
      </p>
    </footer>
  );
}
