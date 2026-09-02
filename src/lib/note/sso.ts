import { getNoteRepo } from "@/lib/note/repo";

const SSO_TTL_MS = 60_000;

export async function issueNoteSsoCode(apexUserId: string, email: string): Promise<string> {
  const code = crypto.randomUUID().replace(/-/g, "");
  await getNoteRepo().saveSsoCode({
    code,
    apexUserId,
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + SSO_TTL_MS,
  });
  return code;
}

export async function consumeNoteSsoCode(code: string) {
  return getNoteRepo().consumeSsoCode(code);
}
