import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Server Actions cap request bodies at 1MB by default, which a single
      // phone photo can exceed on its own — residents attach multiple JPGs
      // via FileUploadField, and a rejected action fails silently (no error
      // state reaches the client, since Next.js rejects the request before
      // our action code runs). Raised to cover a few full-resolution photos.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
