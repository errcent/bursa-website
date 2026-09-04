import { test, expect } from "@playwright/test";

import { AUDIT_ROUTES } from "./routes";

const hasAuth = Boolean(
  process.env.PLAYWRIGHT_AUTH_EMAIL && process.env.PLAYWRIGHT_AUTH_PASSWORD,
);

/**
 * Deterministic performance regression guard.
 * Variable timing/bytes stay in audit JSON; this spec asserts only stable contracts.
 */
test.describe("Performance regression guard (deterministic)", () => {
  for (const route of AUDIT_ROUTES) {
    test(`${route.path} [${route.role}] — no errors, stable shell`, async ({ page }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Filter known third-party noise that is not a regression signal
          // PostHog, Cloudflare challenge, and browser extension errors are not product regressions
          const isThirdParty =
            /posthog/i.test(text) ||
            /challenges\.cloudflare/i.test(text) ||
            /chrome-extension:\/\//i.test(text);
          if (!isThirdParty) consoleErrors.push(text);
        }
      });

      let responseStatus: number | null = null;
      let finalUrl = "";
      try {
        const resp = await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 60_000 });
        responseStatus = resp?.status() ?? null;
      } catch (e) {
        // goto failed
        expect.soft(String(e), `${route.path} goto should not throw`).toBe("");
      }

      // Allow hydration + preloader gate to settle. PreloaderGate removes intro-pending after ~ timing.
      // Wait for networkidle but not fail if analytics keeps connection open.
      try {
        await page.waitForLoadState("networkidle", { timeout: 12_000 });
      } catch {}
      try {
        await page.evaluate(() => {
          try {
            localStorage.setItem("bursa-cookie-consent", "essential-only");
          } catch {}
        });
      } catch {}
      await page.waitForTimeout(800);

      finalUrl = page.url();

      // --- Redirect destination must not have changed unexpectedly
      // Public routes must not land on login wall; gated routes without auth are expected to be login walls
      const isLoginWall = /\/masuk/.test(finalUrl) || /\/login/.test(finalUrl);
      if (route.role === "public") {
        // Public routes should never redirect to auth wall; if they do, it's a regression or mis-scoped gated flag
        expect.soft(isLoginWall, `${route.path} public route should not redirect to login wall (finalUrl=${finalUrl})`).toBe(false);
      } else if (route.gated && !hasAuth) {
        // Without auth, gated routes are correctly login walls; no assertion on wall itself,
        // but we assert the wall is explicit (expected) rather than broken status
        // Status must still be 200 for the wall page itself or 3xx that landed on 200.
        // We don't assert not login wall here.
      } else if (route.gated && hasAuth) {
        // With auth, gated routes must not remain on login wall; if they do, auth failed or role mismatch.
        // For mentor routes with learner auth, being on login wall is expected role mismatch — mark as incomplete, not failure,
        // but we cannot distinguish learner vs mentor auth from env. So only assert for learner role when hasAuth.
        if (route.role === "learner") {
          expect.soft(isLoginWall, `${route.path} learner gated route with auth should not be login wall`).toBe(false);
        }
        // Mentor role with generic auth: do not hard fail, as credential may be learner-only
      }

      // --- HTTP status
      if (responseStatus !== null) {
        // Gated login walls return 200 for the login page itself; that's OK
        // So only fail on 500+ or 404 for non-dynamic routes
        expect.soft(responseStatus, `${route.path} HTTP status should be <500`).toBeLessThan(500);
        if (!route.path.includes("[") && !route.path.includes(":") && route.role === "public") {
          // Public known routes should not be 404
          expect.soft(responseStatus, `${route.path} public route should not be 404`).not.toBe(404);
        }
      }

      // --- Page errors and unexpected console errors
      expect.soft(pageErrors, `${route.path} pageErrors should be empty`).toEqual([]);
      // Console errors: allow empty, but report unexpected ones
      expect.soft(consoleErrors, `${route.path} unexpected console errors`).toEqual([]);

      // --- Image intrinsic dimensions (CLS guard)
      // Every <img> that is in viewport or near should have width/height or fill container stable
      const badImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        const bad: Array<{ src: string; w: string; h: string; naturalW: number; naturalH: number }> = [];
        for (const img of imgs) {
          const src = img.getAttribute("src") || img.currentSrc || "";
          // Skip tracking pixels and posthog
          if (!src || src.startsWith("data:") || src.includes("posthog") || src.includes("cloudflare")) continue;
          const hasAttr = img.hasAttribute("width") && img.hasAttribute("height");
          const rect = img.getBoundingClientRect();
          const hasStableSize = hasAttr || (rect.width > 0 && rect.height > 0 && img.naturalWidth > 0) || img.hasAttribute("fill") || (img.style.width && img.style.height);
          // If image is visible but natural dimensions 0 and no width/height, it's a CLS risk
          const wAttr = img.getAttribute("width") || "";
          const hAttr = img.getAttribute("height") || "";
          if (!hasStableSize) {
            bad.push({ src: src.slice(0, 120), w: wAttr, h: hAttr, naturalW: img.naturalWidth, naturalH: img.naturalHeight });
          }
          // Also catch images with zero rendered size but with src (likely broken)
          // But don't flag explicitly hidden images
          if (rect.width === 0 && rect.height === 0 && img.naturalWidth === 0 && src && !hasAttr) {
            // Could be lazy offscreen not yet loaded; ignore if below fold far? For now don't flag
          }
        }
        return bad.slice(0, 5);
      });
      expect.soft(badImages, `${route.path} images should have intrinsic dimensions (CLS guard)`).toEqual([]);

      // --- Root shell must not leave content hidden after hydration
      const shell = await page.evaluate(() => {
        const htmlHasPending = document.documentElement.classList.contains("intro-pending");
        // Also check if body or #__next is hidden via CSS
        const bodyVisibility = getComputedStyle(document.body).visibility;
        const bodyDisplay = getComputedStyle(document.body).display;
        const htmlOverflowHidden = document.documentElement.style.overflow === "hidden";
        // Check if main content is hidden (opacity 0 with intro-pending)
        // Pre-paint script adds intro-pending to hide content until PreloaderGate hydrates; it must be removed
        // After 800ms + settle, it should be gone unless sessionStorage says intro seen already (which also removes it)
        // So we allow pending only if sessionStorage had intro-seen before navigation (but we just navigated, so it should be gone after gate)
        // We'll check after additional wait for gate timeout (max 2s intro duration)
        return { htmlHasPending, bodyVisibility, bodyDisplay, htmlOverflowHidden };
      });

      // Give PreloaderGate extra time to remove intro-pending (it has timed animation). Poll up to 3s.
      if (shell.htmlHasPending) {
        try {
          await page.waitForFunction(() => !document.documentElement.classList.contains("intro-pending"), { timeout: 3000 });
        } catch {}
      }
      const finalShell = await page.evaluate(() => ({
        htmlHasPending: document.documentElement.classList.contains("intro-pending"),
        bodyVisibility: getComputedStyle(document.body).visibility,
      }));
      expect.soft(finalShell.htmlHasPending, `${route.path} intro-pending should be removed after hydration`).toBe(false);
      expect.soft(finalShell.bodyVisibility, `${route.path} body should be visible after hydration`).not.toBe("hidden");
    });
  }
});
