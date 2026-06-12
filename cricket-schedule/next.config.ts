import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a fully static site (used for GitHub Pages, where
// fixture data is pre-generated into public/fixtures.json by CI and the
// /api route is excluded). Default builds keep the dynamic API route.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
