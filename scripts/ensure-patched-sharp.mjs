import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

/** Next may nest an older sharp; remove so runtime resolves root sharp@0.35.4. */
const nestedSharp = join(process.cwd(), "node_modules", "next", "node_modules", "sharp");

if (existsSync(nestedSharp)) {
  rmSync(nestedSharp, { recursive: true, force: true });
}
