import puppeteer from "puppeteer-core";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000/ai-mentor";

async function testShiftEnter() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));

    // Composer on home screen (isStreaming = false)
    const textarea = await page.$("textarea");
    if (!textarea) throw new Error("No textarea found on home screen");

    await textarea.click();
    await textarea.type("Line 1");
    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");
    await textarea.type("Line 2");

    const val = await page.evaluate(() => document.querySelector("textarea")?.value);
    console.log("Captured Textarea Value:", JSON.stringify(val));
    const passed = val?.includes("\n") && val?.includes("Line 1") && val?.includes("Line 2");
    console.log("Shift+Enter Test Result:", passed ? "PASSED" : "FAILED");
  } finally {
    await browser.close();
  }
}

testShiftEnter().catch(console.error);
