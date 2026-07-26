import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `npm run build` writes a plain HTML/CSS/JS site to `out/`.
  // Netlify serves that directly, so there is no server runtime to go wrong.
  output: "export",
  // Emit `about/index.html` instead of `about.html` so URLs keep their
  // trailing slash and match the quiz at `/lds-quiz/`.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
