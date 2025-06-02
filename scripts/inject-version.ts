import { execSync } from "child_process";
import { writeFileSync } from "fs";

const hash = execSync("git rev-parse --short HEAD").toString().trim();
const env  = `NEXT_PUBLIC_APP_VERSION=${hash}\n`;

writeFileSync(".env.local",      env);   // local builds / dev
writeFileSync(".env.apphosting", env);   // picked up by App Hosting

console.log(`✅ Injected commit ${hash}`);