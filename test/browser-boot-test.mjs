// End-to-end browser test: loads the real published page in headless
// Chromium, boots UmaiOS under v86, and logs in with real keystrokes.
//
// This exists because the browser path kept breaking in ways the QEMU boot
// test could not see: a missing BIOS (v86 hands the kernel to the guest as
// an option ROM that only firmware will scan, so without it the CPU never
// starts), and a serial console that rendered but was not wired to the
// keyboard. Both looked like "a black terminal with a cursor".
//
// Usage: node test/browser-boot-test.mjs [baseUrl]

import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:8099";
const CHROME = process.env.CHROME_PATH || undefined;
const BOOT_TIMEOUT_MS = 180000;

const fail = (msg, serial) => {
  console.error("FAIL: " + msg);
  if (serial) {
    console.error("----- serial output -----");
    console.error(serial);
    console.error("-------------------------");
  }
  process.exit(1);
};

const waitForSerial = async (page, pattern, timeoutMs, what) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const serial = await page.evaluate(() => window.__serial || "");
    if (pattern.test(serial)) return serial;
    await page.waitForTimeout(1000);
  }
  const serial = await page.evaluate(() => window.__serial || "");
  fail(`timed out waiting for ${what}`, serial);
};

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

await page.goto(BASE + "/", { waitUntil: "load" });

// The page only enables the button once the boot images are reachable.
await page.waitForSelector("#boot-btn:not([disabled])", { timeout: 30000 });
await page.click("#boot-btn");

// Capture the guest's serial output straight off the emulator bus, so the
// assertions do not depend on how xterm.js happens to render.
await page.waitForFunction(() => window.emulator, null, { timeout: 30000 });
await page.evaluate(() => {
  window.__serial = "";
  window.emulator.add_listener("serial0-output-byte", (byte) => {
    window.__serial += String.fromCharCode(byte);
  });
});

await waitForSerial(page, /login:/, BOOT_TIMEOUT_MS, "the login prompt");
console.log("ok: reached the login prompt");

// Type as a user would: real key events into the focused terminal. This is
// what proves the serial console's keyboard wiring actually works.
await page.click("#terminal");
await page.keyboard.type("root");
await page.keyboard.press("Enter");

await waitForSerial(page, /Password:/i, 30000, "the password prompt");
console.log("ok: username was accepted (keyboard input reaches the guest)");

await page.keyboard.type("umaios");
await page.keyboard.press("Enter");

// Busybox's root prompt ends in '#'.
const serial = await waitForSerial(page, /#\s*$|#[^\n]*$/m, 30000, "a root shell prompt");
console.log("ok: logged in, got a shell prompt");

if (pageErrors.length) fail("uncaught page errors: " + pageErrors.join("; "), serial);

console.log("PASS: UmaiOS boots in a browser and accepts keyboard login.");
await browser.close();
