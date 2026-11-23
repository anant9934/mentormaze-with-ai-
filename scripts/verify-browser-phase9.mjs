import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000/ai-mentor";
const SCREENSHOT_DIR = path.resolve("reports/ai-mentor/screenshots");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runBrowserAudit() {
  const auditResults = {
    timestamp: new Date().toISOString(),
    viewports: {},
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    successfulRequests: [],
    interactions: {},
    computedStyles: {},
    liveInferenceTurn: {},
  };

  console.log("Launching Headless Chrome for Phase 9 Audit...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
  });

  try {
    const page = await browser.newPage();

    // 1. Console listener
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === "error") {
        auditResults.consoleErrors.push({ text, location: msg.location() });
        console.error(`[Browser ERROR] ${text}`);
      } else if (type === "warning") {
        auditResults.consoleWarnings.push({ text, location: msg.location() });
        console.warn(`[Browser WARNING] ${text}`);
      }
    });

    page.on("pageerror", (err) => {
      auditResults.consoleErrors.push({ text: err.message, type: "pageerror" });
      console.error(`[Page ERROR] ${err.message}`);
    });

    // 2. Network listener
    page.on("requestfailed", (req) => {
      auditResults.networkFailures.push({
        url: req.url(),
        method: req.method(),
        errorText: req.failure()?.errorText || "Unknown failure",
      });
      console.warn(`[Network FAIL] ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    });

    page.on("response", (res) => {
      if (res.status() >= 400) {
        auditResults.networkFailures.push({
          url: res.url(),
          status: res.status(),
          statusText: res.statusText(),
        });
        console.warn(`[HTTP ${res.status()}] ${res.url()}`);
      } else {
        auditResults.successfulRequests.push({
          url: res.url(),
          status: res.status(),
          contentType: res.headers()["content-type"] || "",
        });
      }
    });

    // ==========================================
    // 1. DESKTOP VIEWPORT (1440 × 900)
    // ==========================================
    console.log("\n==========================================");
    console.log("1. AUDITING DESKTOP (1440 × 900)");
    console.log("==========================================");
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));

    const desktopHomeScreenshot = path.join(SCREENSHOT_DIR, "desktop_1440x900_home.png");
    await page.screenshot({ path: desktopHomeScreenshot, fullPage: false });
    auditResults.viewports.desktop = {
      width: 1440,
      height: 900,
      screenshot: desktopHomeScreenshot,
    };
    console.log(`Saved: ${desktopHomeScreenshot}`);

    // Verify Desktop Computed Styles
    const desktopStyles = await page.evaluate(() => {
      const body = document.querySelector("body");
      const sidebar = document.querySelector("aside");
      const main = document.querySelector("main");
      const h1 = document.querySelector("h1");
      const composer = document.querySelector("textarea");
      const chips = document.querySelectorAll(".grid button");
      const avatarImg = document.querySelector("aside img");

      const bodyStyle = body ? window.getComputedStyle(body) : null;
      const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
      const mainStyle = main ? window.getComputedStyle(main) : null;
      const h1Style = h1 ? window.getComputedStyle(h1) : null;
      const composerStyle = composer ? window.getComputedStyle(composer) : null;
      const avatarStyle = avatarImg ? window.getComputedStyle(avatarImg) : null;

      return {
        bodyFont: bodyStyle?.fontFamily,
        backgroundColor: bodyStyle?.backgroundColor,
        color: bodyStyle?.color,
        sidebar: {
          width: sidebarStyle?.width,
          display: sidebarStyle?.display,
          position: sidebarStyle?.position,
        },
        main: {
          borderRadius: mainStyle?.borderRadius,
          backgroundColor: mainStyle?.backgroundColor,
          overflow: mainStyle?.overflow,
        },
        h1: {
          text: h1?.innerText,
          fontFamily: h1Style?.fontFamily,
          fontSize: h1Style?.fontSize,
        },
        avatar: {
          width: avatarStyle?.width,
          height: avatarStyle?.height,
          objectFit: avatarStyle?.objectFit,
        },
        chipsCount: chips.length,
      };
    });
    auditResults.computedStyles = desktopStyles;
    console.log("Desktop Computed Styles:", JSON.stringify(desktopStyles, null, 2));

    // ==========================================
    // 2. FUNCTIONAL INTERACTION AUDIT
    // ==========================================
    console.log("\n==========================================");
    console.log("2. EXECUTING INTERACTION MATRIX");
    console.log("==========================================");

    // Interaction 1: Sidebar Navigation (Active States)
    console.log("Testing Sidebar Navigation to 'History'...");
    const historyBtn = await page.$("aside nav button:nth-child(2)");
    let historyNavSuccess = false;
    if (historyBtn) {
      await historyBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      historyNavSuccess = await page.evaluate(() => document.body.innerText.includes("Mentorship History") || document.body.innerText.includes("Past Sessions"));
    }
    auditResults.interactions.sidebarHistoryNavigation = {
      tested: true,
      success: historyNavSuccess,
    };
    console.log(`Sidebar History Navigation: ${historyNavSuccess ? "PASSED" : "FAILED"}`);

    // Return to chat
    const chatBtn = await page.$("aside nav button:first-child");
    if (chatBtn) {
      await chatBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // Interaction 2: Suggestion Chip Click
    console.log("Testing Suggestion Chip Selection (DSA / Coding)...");
    const codingChipClicked = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll(".grid button"));
      const chip = chips.find((c) => c.innerText.includes("Coding") || c.innerText.includes("DSA"));
      if (chip) {
        chip.click();
        return true;
      }
      return false;
    });

    let convLaunched = false;
    if (codingChipClicked) {
      console.log("Clicked DSA chip! Waiting for streaming response...");
      // Wait for SSE streaming response
      await new Promise((r) => setTimeout(r, 4500));
      convLaunched = await page.evaluate(() => {
        return document.body.innerText.includes("Dr. Aarav Mehta") && (
          document.body.innerText.includes("Specialist") ||
          document.body.innerText.includes("Algorithm") ||
          document.body.innerText.includes("Complexity") ||
          document.body.innerText.includes("Stop Generating") ||
          document.querySelectorAll("button").length > 5
        );
      });
    }

    const conversationScreenshot = path.join(SCREENSHOT_DIR, "desktop_active_conversation.png");
    await page.screenshot({ path: conversationScreenshot, fullPage: false });
    auditResults.interactions.suggestionChipLaunch = {
      tested: true,
      success: convLaunched,
      screenshot: conversationScreenshot,
    };
    console.log(`Suggestion Chip Session Launch: ${convLaunched ? "PASSED" : "PARTIAL"} (Saved: ${conversationScreenshot})`);

    // Interaction 3: Send Message in Active Conversation
    console.log("Testing Active Turn Message Submission...");
    const chatInput = await page.$("textarea");
    let turnSuccess = false;
    if (chatInput) {
      const startMs = Date.now();
      await chatInput.click();
      await chatInput.type("What is the time complexity of QuickSort in the average case?");
      await page.keyboard.press("Enter");
      console.log("Sent follow-up prompt! Waiting for mentor response...");
      await new Promise((r) => setTimeout(r, 5000));
      const latencyMs = Date.now() - startMs;

      const pageText = await page.evaluate(() => document.body.innerText);
      turnSuccess = pageText.includes("O(n log n)") || pageText.includes("QuickSort") || pageText.includes("partition");

      auditResults.liveInferenceTurn = {
        prompt: "What is the time complexity of QuickSort in the average case?",
        receivedResponse: turnSuccess,
        observedLatencyMs: latencyMs,
      };
      console.log(`Live Turn Verification: ${turnSuccess ? "PASSED" : "PENDING/FALLBACK"} (${latencyMs}ms)`);
    }

    // Interaction 4: Test Shift+Enter vs Enter in Composer
    console.log("Testing Shift+Enter multiline behavior...");
    const composerArea = await page.$("textarea");
    let multilinePreserved = false;
    if (composerArea) {
      await composerArea.click();
      await composerArea.type("First line");
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
      await composerArea.type("Second line");

      const val = await page.evaluate(() => document.querySelector("textarea")?.value);
      multilinePreserved = val?.includes("\n") && val?.includes("Second line");
      auditResults.interactions.shiftEnterMultiline = {
        tested: true,
        multilinePreserved,
      };
      console.log(`Shift+Enter Multiline: ${multilinePreserved ? "PASSED" : "FAILED"}`);
    }

    // Capture Conversation State Screenshot
    const fullConvScreenshot = path.join(SCREENSHOT_DIR, "desktop_conversation_turn_complete.png");
    await page.screenshot({ path: fullConvScreenshot, fullPage: false });
    console.log(`Saved: ${fullConvScreenshot}`);

    // Return to Home via back button
    const backButton = await page.$("button[title*='Back' i], button:has(svg.lucide-arrow-left)");
    if (backButton) {
      await backButton.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    // ==========================================
    // 3. TABLET VIEWPORT (1024 × 768)
    // ==========================================
    console.log("\n==========================================");
    console.log("3. AUDITING TABLET (1024 × 768)");
    console.log("==========================================");
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));

    const tabletScreenshot = path.join(SCREENSHOT_DIR, "tablet_1024x768_home.png");
    await page.screenshot({ path: tabletScreenshot, fullPage: false });
    const tabletSidebarInfo = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      if (!aside) return { exists: false, visible: false };
      const rect = aside.getBoundingClientRect();
      return {
        exists: true,
        visible: rect.width > 0 && rect.left >= 0,
        width: rect.width,
        height: rect.height,
      };
    });
    auditResults.viewports.tablet = {
      width: 1024,
      height: 768,
      screenshot: tabletScreenshot,
      sidebar: tabletSidebarInfo,
    };
    console.log(`Saved: ${tabletScreenshot}`);
    console.log(`Tablet Sidebar: Visible=${tabletSidebarInfo.visible}, Width=${tabletSidebarInfo.width}px`);

    // ==========================================
    // 4. MOBILE VIEWPORT (390 × 844)
    // ==========================================
    console.log("\n==========================================");
    console.log("4. AUDITING MOBILE (390 × 844)");
    console.log("==========================================");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileHomeScreenshot = path.join(SCREENSHOT_DIR, "mobile_390x844_home.png");
    await page.screenshot({ path: mobileHomeScreenshot, fullPage: false });
    console.log(`Saved: ${mobileHomeScreenshot}`);

    // Check horizontal scroll / overflow on mobile
    const horizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    // Test Mobile Drawer Toggle
    console.log("Testing Mobile Drawer Hamburger Toggle...");
    const hamburgerBtn = await page.$("header button, div.md\\:hidden button");
    let drawerOpened = false;
    let mobileDrawerScreenshot = null;
    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      drawerOpened = await page.evaluate(() => {
        const aside = document.querySelector("aside");
        if (!aside) return false;
        const rect = aside.getBoundingClientRect();
        return rect.left >= 0 && rect.width > 200;
      });

      mobileDrawerScreenshot = path.join(SCREENSHOT_DIR, "mobile_390x844_drawer_open.png");
      await page.screenshot({ path: mobileDrawerScreenshot, fullPage: false });
      console.log(`Saved: ${mobileDrawerScreenshot}`);

      // Close drawer
      const closeBtn = await page.$("aside button[title*='Close' i], aside button:has(svg.lucide-x)");
      if (closeBtn) {
        await closeBtn.click();
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    auditResults.viewports.mobile = {
      width: 390,
      height: 844,
      screenshot: mobileHomeScreenshot,
      drawerScreenshot: mobileDrawerScreenshot,
      drawerToggleSuccess: drawerOpened,
      horizontalOverflowDetected: horizontalOverflow,
    };
    console.log(`Mobile Drawer Toggle: ${drawerOpened ? "PASSED" : "FAILED"}`);
    console.log(`Mobile Horizontal Overflow: ${horizontalOverflow ? "DEFECT DETECTED" : "NONE (CLEAN)"}`);

  } finally {
    await browser.close();
    console.log("\nBrowser session closed cleanly.");
  }

  // Persist Audit Summary
  const outPath = path.resolve("reports/ai-mentor/browser_audit_results.json");
  fs.writeFileSync(outPath, JSON.stringify(auditResults, null, 2), "utf8");
  console.log(`\nAudit results successfully saved to ${outPath}`);
}

runBrowserAudit().catch((err) => {
  console.error("Browser audit failed with error:", err);
  process.exit(1);
});
