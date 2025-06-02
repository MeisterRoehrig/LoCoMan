import { writeFileSync } from "fs";
import { execSync } from "child_process";

const hash = execSync("git rev-parse --short HEAD").toString().trim();
const out  = `NEXT_PUBLIC_APP_VERSION=${hash}\n`;

writeFileSync(".env.local",       out);   // local dev + next build
writeFileSync(".env.apphosting",  out);   // picked up by App Hosting

console.log(`✅ Injected commit ${hash}`);