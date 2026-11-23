import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:3000/ai-mentor";
const DESKTOP_PATH = path.resolve("public/brand/phase3-2-desktop.png");
const MOBILE_PATH = path.resolve("public/brand/phase3-2-mobile.png");

async function main() {
  console.log("=== STARTING PHASE 3.2 BROWSER AUDIT & SCREENSHOT CAPTURE ===");
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

  // Set mock authentication session cookie so browser makes authenticated calls
  await page.setCookie({
    name: "mm_session_token",
    value: "tok-student-phase3-2-audit",
    domain: "localhost",
    path: "/",
  });

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });

  // 1. Desktop Viewport (1280x800)
  console.log("Setting desktop viewport 1280x800...");
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 2000)); // wait for layout stabilization

  console.log(`Capturing desktop screenshot to: ${DESKTOP_PATH}`);
  await page.screenshot({ path: DESKTOP_PATH, fullPage: false });
  console.log(`Desktop screenshot captured (${fs.statSync(DESKTOP_PATH).size} bytes)`);

  // 2. Mobile Viewport (390x844 - iPhone 14 / modern smartphone)
  console.log("Setting mobile viewport 390x844...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`Capturing mobile screenshot to: ${MOBILE_PATH}`);
  await page.screenshot({ path: MOBILE_PATH, fullPage: false });
  console.log(`Mobile screenshot captured (${fs.statSync(MOBILE_PATH).size} bytes)`);

  await browser.close();

  console.log("\n=== BROWSER AUDIT SUMMARY ===");
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn("Errors encountered:", consoleErrors);
  }
  console.log("Screenshots verified and written to public/brand/.");
}

main().catch((err) => {
  console.error("Browser audit failed:", err);
  process.exit(1);
});
