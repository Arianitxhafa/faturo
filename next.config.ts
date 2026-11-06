import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rendered on the server only; keep it out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  // The PDF route reads its font files at runtime, so ship them with that function.
  outputFileTracingIncludes: { "/app/invoices/[id]/pdf": ["./src/lib/pdf/fonts/**"] },
};

export default nextConfig;
