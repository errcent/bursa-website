import { Resend } from "resend";

async function test(key: string | undefined, label: string) {
  if (!key) {
    console.log(label, "missing key");
    return;
  }
  const resend = new Resend(key);
  const result = await resend.events.send({
    event: "waitlist.joined",
    email: "test-sync-probe@example.com",
    payload: { probe: true },
  });
  console.log(label, result.error?.message ?? "ok", result.data ?? null);
}

async function main() {
  await test(process.env.RESEND_SETUP_KEY, "setup");
  await test(process.env.RESEND_API_KEY, "prod");
}

void main();
