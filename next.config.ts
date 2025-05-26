import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;



import { execSync } from "child_process";

function getCommit() {
  // ❶ Try reading it from CI (comes from step 2 or apphosting.yaml)
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;

  // ❷ Fallback: read it from the local .git folder
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

module.exports = {
  reactStrictMode: true,
  env: {
    // Anything that starts with NEXT_PUBLIC_ is inlined for the browser
    NEXT_PUBLIC_APP_VERSION: getCommit(),
  },
};