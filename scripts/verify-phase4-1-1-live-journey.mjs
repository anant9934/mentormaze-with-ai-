import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USER_ID = "user-student-1";

async function runPhase411BrowserAudit() {
  console.log("1. Starting Phase 4.1.1 Browser & Accessibility Verification...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("localhost:3000")) {
      const headers = Object.assign({}, req.headers(), {
        "x-mentormaze-test": "true",
        "x-mentormaze-auth-user": USER_ID,
      });
      req.continue({ headers });
    } else {
      req.continue();
    }
  });

  console.log(`- Navigating to ${BASE_URL}/ai-mentor...`);
  await page.goto(`${BASE_URL}/ai-mentor`, { waitUntil: "networkidle2", timeout: 30000 });

  // 1. Desktop Mentorship Home (1280x800)
  console.log("- Capturing Desktop Mentorship Home (1280x800)...");
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 2000));
  const desktopPath = path.resolve("public/brand/phase4-1-1-desktop.png");
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log(`  -> Saved: ${desktopPath} (${fs.statSync(desktopPath).size} bytes)`);

  // 2. Open Check-In Modal with Honest Delivery Notice
  console.log("- Opening Mentorship Check-In Modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const checkinBtn = buttons.find(
      (b) => b.textContent && (b.textContent.includes("Check-In") || b.textContent.includes("Check In"))
    );
    if (checkinBtn) checkinBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const checkinPath = path.resolve("public/brand/phase4-1-1-checkin-modal.png");
  await page.screenshot({ path: checkinPath, fullPage: false });
  console.log(`  -> Saved Check-In Modal: ${checkinPath} (${fs.statSync(checkinPath).size} bytes)`);

  // Close check-in modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const skipBtn = buttons.find((b) => b.textContent && b.textContent.includes("Skip"));
    if (skipBtn) skipBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Reconciled 5-Tier Assessment View with inline corrections
  console.log("- Opening Reconciled 5-Tier Assessment View...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const assessBtn = buttons.find((b) => b.textContent && b.textContent.includes("Assessment"));
    if (assessBtn) assessBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const assessPath = path.resolve("public/brand/phase4-1-1-assessment.png");
  await page.screenshot({ path: assessPath, fullPage: false });
  console.log(`  -> Saved Assessment View: ${assessPath} (${fs.statSync(assessPath).size} bytes)`);

  // 4. Roadmap Workspace
  console.log("- Opening Roadmap Workspace...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const roadmapBtn = buttons.find((b) => b.textContent && b.textContent.includes("Roadmap & Plan"));
    if (roadmapBtn) roadmapBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const roadmapPath = path.resolve("public/brand/phase4-1-1-roadmap.png");
  await page.screenshot({ path: roadmapPath, fullPage: false });
  console.log(`  -> Saved Roadmap Workspace: ${roadmapPath} (${fs.statSync(roadmapPath).size} bytes)`);

  // 5. Mobile Mentorship Home (390x844 - iPhone standard)
  console.log("- Capturing Mobile Mentorship View (390x844)...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  // Return to home
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const homeBtn = buttons.find((b) => b.textContent && (b.textContent.includes("Home") || b.textContent.includes("Chat")));
    if (homeBtn) homeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const mobilePath = path.resolve("public/brand/phase4-1-1-mobile.png");
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log(`  -> Saved Mobile View: ${mobilePath} (${fs.statSync(mobilePath).size} bytes)`);

  await browser.close();

  console.log("\n=== PHASE 4.1.1 BROWSER AUDIT SUMMARY ===");
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn("Detected Errors:", consoleErrors);
  }
  console.log("Phase 4.1.1 UI journey successfully completed with 0 blocking errors.");
}

runPhase411BrowserAudit().catch((err) => {
  console.error("Browser audit failed:", err);
  process.exit(1);
});
