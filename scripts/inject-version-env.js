import { writeFileSync } from "fs";
import { execSync } from "child_process";

const commit = execSync("git rev-parse --short HEAD").toString().trim();
const output = `NEXT_PUBLIC_APP_VERSION=${commit}\n`;

writeFileSync(".env.local", output);        // local build
writeFileSync(".env.apphosting", output);   // Firebase remote build

console.log(`Injected commit hash: ${commit}`);
