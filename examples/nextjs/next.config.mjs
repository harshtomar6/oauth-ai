/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the workspace packages so the example works without prebuilding.
  transpilePackages: [
    "@oauth-ai/core",
    "@oauth-ai/openai",
    "@oauth-ai/anthropic",
    "@oauth-ai/react",
  ],
};

export default nextConfig;
