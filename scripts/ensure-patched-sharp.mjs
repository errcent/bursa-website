import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

/** Next 16.2.x nests sharp@0.34.5; remove so runtime resolves root sharp@0.35.3. */
const nestedSharp = join(process.cwd(), "node_modules", "next", "node_modules", "sharp");

if (existsSync(nestedSharp)) {
  rmSync(nestedSharp, { recursive: true, force: true });
}
