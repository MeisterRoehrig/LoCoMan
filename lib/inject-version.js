const commit = execSync("git rev-parse --short HEAD").toString().trim();
const timestamp = new Date().toISOString();
const envPath = path.resolve(__dirname, "../.env.production.local");

const contents = `
NEXT_PUBLIC_GIT_COMMIT=${commit}
NEXT_PUBLIC_BUILD_TIME=${timestamp}
`;

fs.writeFileSync(envPath, contents);
