const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "../docs/screenshots");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Chrome from:", CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900"],
  });

  const consoleErrors = [];

  const desktopViewport = { width: 1440, height: 900 };
  const mobileViewport = { width: 375, height: 812, isMobile: true, hasTouch: true };

  async function createPage(viewport) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[${viewport.width === 1440 ? "Desktop" : "Mobile"}] ${msg.text()}`);
      }
    });
    return page;
  }

  // 1. Authenticate as Student
  console.log("Authenticating student session...");
  const authPage = await browser.newPage();
  await authPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const studentRes = await authPage.evaluate(async () => {
    localStorage.setItem("mm_active_role", "student");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "anant@example.com", password: "student123", role: "student" }),
    });
    return res.json();
  });
  console.log("Student auth:", studentRes.success, studentRes.user?.role, studentRes.sessionToken ? "token-present" : "no-token");
  const studentCookies = studentRes.sessionToken ? [{
    name: "mm_session_token",
    value: studentRes.sessionToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  }] : await authPage.cookies();
  await authPage.close();

  // Helper to capture a surface
  async function captureSurface(filenamePrefix, pathUrl, options = {}) {
    console.log(`Capturing: ${filenamePrefix} (${pathUrl})...`);
    for (const [device, vp] of [["desktop", desktopViewport], ["mobile", mobileViewport]]) {
      const page = await createPage(vp);
      if (options.role === "mentor") {
        await page.setCookie(...options.mentorCookies);
        await page.evaluateOnNewDocument(() => {
          localStorage.setItem("mm_active_role", "mentor");
        });
      } else if (options.authenticated !== false) {
        await page.setCookie(...studentCookies);
        await page.evaluateOnNewDocument(() => {
          localStorage.setItem("mm_active_role", "student");
        });
      }

      await page.goto(`${BASE_URL}${pathUrl}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(2500);

      if (options.beforeScreenshot) {
        const res = await options.beforeScreenshot(page, device);
        console.log(`[${device}] beforeScreenshot hook completed:`, res);
        await sleep(1000);
      }

      const filePath = path.join(OUTPUT_DIR, `${device}_${filenamePrefix}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved: ${filePath}`);
      await page.close();
    }
  }

  // 1. Public Landing Page
  await captureSurface("01_landing_page", "/", { authenticated: false });

  // 2. Student Home
  await captureSurface("02_student_home", "/dashboard");

  // 3. AI Mentor (ASTRION)
  await captureSurface("03_ai_mentor", "/ai-mentor");

  // 4. Find a Mentor Directory
  await captureSurface("04_find_mentor", "/mentors");

  // 5. My Mentorship Hub
  await captureSurface("05_my_mentorship", "/dashboard/mentorship");

  // 6. Mentorship Summary Sharing Modal
  await captureSurface("06_bridge_modal", "/dashboard/mentorship", {
    beforeScreenshot: async (page) => {
      // Find button with text "Bridge to Mentor" or "Prepare Bridge Briefing"
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent && (b.textContent.includes("Bridge to Mentor") || b.textContent.includes("Prepare Bridge") || b.textContent.includes("Bridge Briefing")));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (clicked) {
        await sleep(1000);
      }
    },
  });

  // Setup Mentor Session
  console.log("Authenticating mentor session...");
  const mentorAuthPage = await browser.newPage();
  await mentorAuthPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const mentorRes = await mentorAuthPage.evaluate(async () => {
    localStorage.setItem("mm_active_role", "mentor");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "priya.sharma@microsoft.com", password: "mentor123", role: "mentor" }),
    });
    return res.json();
  });
  console.log("Mentor auth:", mentorRes.success, mentorRes.user?.role, mentorRes.sessionToken ? "token-present" : "no-token");
  const mentorCookies = mentorRes.sessionToken ? [{
    name: "mm_session_token",
    value: mentorRes.sessionToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  }] : await mentorAuthPage.cookies();
  await mentorAuthPage.close();

  // 7. Mentor Overview
  await captureSurface("07_mentor_overview", "/mentor/dashboard", { role: "mentor", mentorCookies });

  // 8. Mentor Intake Drawer
  await captureSurface("08_mentor_intake_drawer", "/mentor/dashboard", {
    role: "mentor",
    mentorCookies,
    beforeScreenshot: async (page) => {
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent && (b.textContent.includes("Student Briefing") || b.textContent.includes("Briefing")));
        if (btn) {
          btn.click();
          return { clicked: true, text: btn.textContent.trim() };
        }
        return { clicked: false, availableButtons: btns.map((b) => b.textContent.trim()) };
      });
      await sleep(1500);
      return clicked;
    },
  });

  // 9. LiveKit Mentoring Session
  await captureSurface("09_livekit_session", "/sessions/booking-1/live");

  // 10. Profile and Settings
  await captureSurface("10_settings", "/settings");

  await browser.close();

  console.log("\n--- Visual Verification Console Audit ---");
  console.log(`Total captured: 20 screenshots (10 desktop, 10 mobile).`);
  console.log(`Console error count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log("Console errors observed:");
    consoleErrors.slice(0, 10).forEach((err) => console.log("  -", err));
  } else {
    console.log("Zero browser console errors detected.");
  }
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
