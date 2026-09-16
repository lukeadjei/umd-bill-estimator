import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Our own S3 bucket (housing photos) -- unlike the Google avatar case
    // (plain <img> forced by Google's referrer-policy rate-limiting), this
    // is our own infrastructure, so next/image's real optimization applies.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "umd-bill-estimator-photos.s3.us-east-2.amazonaws.com",
      },
    ],
    // Next blocks remote SVGs by default -- an SVG can embed a <script>, so
    // this is a real XSS guard, not boilerplate. Safe to allow here because
    // the only thing that can ever land in this bucket is what the
    // s3-photo-uploader credential uploads (us), never arbitrary user
    // content -- but keep the recommended CSP alongside it anyway, so a
    // served SVG still can't execute a script even in principle.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
