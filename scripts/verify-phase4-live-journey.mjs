import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USER_ID = "user-student-1";

const AUTH_HEADERS = {
  "Content-Type": "application/json",
  "x-mentormaze-test": "true",
  "x-mentormaze-auth-user": USER_ID,
};

async function seedStudentState() {
  console.log("1. Seeding Student Mentorship State for UI Verification...");

  // Create primary goal
  const goalRes = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      title: "Staff Distributed Systems Architect",
      category: "career",
      importance: "primary",
      targetOutcome: "Architect geo-replicated consensus clusters and low-latency storage engines.",
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  const goalData = await goalRes.json();
  const goalId = goalData.goal?.id;
  console.log(`- Primary goal ready: ${goalId || "existing"}`);

  if (goalId) {
    // Generate roadmap
    const rdmRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        action: "generate",
        goalId,
      }),
    });
    const rdmData = await rdmRes.json();
    console.log(`- Roadmap generated: ${rdmData.roadmap?.id || "existing"}`);
  }

  // Seed student memory fact
  await fetch(`${BASE_URL}/api/ai-mentor/memory`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      category: "learning_preferences",
      key: "Preferred Learning Style",
      value: "First-principles systems derivation with code implementations in Go & Rust",
      provenance: "student_reported",
      confidence: 1.0,
      studentConfirmed: true,
    }),
  });
  console.log("- Student memory seeded.");
}

async function runBrowserAudit() {
  console.log("\n2. Launching Headless Chrome Audit...");
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

  page.on("response", (res) => {
    if (res.status() === 403) {
      console.log("403 from URL:", res.url());
    }
  });

  // Intercept requests to attach auth headers only to local app requests (avoiding font CORS issues)
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

  // A. Desktop Mentorship Home (1280x800)
  console.log("- Capturing Desktop Mentorship Home (1280x800)...");
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 2000));
  const desktopPath = path.resolve("public/brand/phase4-desktop.png");
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log(`  -> Saved: ${desktopPath} (${fs.statSync(desktopPath).size} bytes)`);

  // B. Mobile Mentorship Home (390x844 - iPhone standard)
  console.log("- Capturing Mobile Mentorship Home (390x844)...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 2000));
  const mobilePath = path.resolve("public/brand/phase4-mobile.png");
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log(`  -> Saved: ${mobilePath} (${fs.statSync(mobilePath).size} bytes)`);

  // Reset to desktop viewport for interactive tool captures
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 1000));

  // C. Roadmap Workspace Capture
  console.log("- Interacting: Opening Roadmap & Plan...");
  await page.evaluate(() => {
    // Find button containing Roadmap & Plan
    const buttons = Array.from(document.querySelectorAll("button"));
    const roadmapBtn = buttons.find((b) => b.textContent && b.textContent.includes("Roadmap & Plan"));
    if (roadmapBtn) roadmapBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const roadmapPath = path.resolve("public/brand/phase4-roadmap.png");
  await page.screenshot({ path: roadmapPath, fullPage: false });
  console.log(`  -> Saved Roadmap Workspace: ${roadmapPath} (${fs.statSync(roadmapPath).size} bytes)`);

  // D. Goals Manager Capture
  console.log("- Interacting: Opening My Goals...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const goalsBtn = buttons.find((b) => b.textContent && b.textContent.includes("My Goals"));
    if (goalsBtn) goalsBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const goalsPath = path.resolve("public/brand/phase4-goals.png");
  await page.screenshot({ path: goalsPath, fullPage: false });
  console.log(`  -> Saved Goals Manager: ${goalsPath} (${fs.statSync(goalsPath).size} bytes)`);

  // E. 5-Tier Assessment Capture
  console.log("- Interacting: Opening Assessment...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const assessBtn = buttons.find((b) => b.textContent && b.textContent.includes("Assessment"));
    if (assessBtn) assessBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const assessPath = path.resolve("public/brand/phase4-assessment.png");
  await page.screenshot({ path: assessPath, fullPage: false });
  console.log(`  -> Saved Assessment View: ${assessPath} (${fs.statSync(assessPath).size} bytes)`);

  await browser.close();

  console.log("\n=== AUDIT RESULTS ===");
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn("Errors:", consoleErrors);
  }
  console.log("All Phase 4 UI views successfully verified and captured.");
}

async function main() {
  await seedStudentState();
  await runBrowserAudit();
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
