import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(frontendRoot, '..');
const sandboxStatePath = path.join(workspaceRoot, 'yor_backend', 'dev-data', 'yor-sandbox.json');
const outputDir = path.join(workspaceRoot, 'qa-screens', 'can-encode-2026-06-06');
const frontendBaseUrl = 'http://localhost:5173';
const backendBaseUrl = 'http://127.0.0.1:8787';

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function apiRequest(route, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${backendBaseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function loginApi(email, password) {
  const { response, payload } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  if (!response.ok) {
    throw new Error(`API login failed for ${email}: ${JSON.stringify(payload)}`);
  }

  const cookie = response.headers.get('set-cookie')?.split(';')[0];

  if (!cookie) {
    throw new Error(`No session cookie returned for ${email}.`);
  }

  return cookie;
}

async function resetSandbox() {
  const superCookie = await loginApi('yoradmin@gmail.com', '1');
  const { response, payload } = await apiRequest('/api/admin/sandbox/reset', {
    method: 'POST',
    cookie: superCookie
  });

  if (!response.ok) {
    throw new Error(`Sandbox reset failed: ${JSON.stringify(payload)}`);
  }
}

async function loadSandboxState() {
  return JSON.parse(await fs.readFile(sandboxStatePath, 'utf8'));
}

function findMember(state, predicate) {
  const member = state.members.find(predicate);

  if (!member) {
    throw new Error('Expected sandbox member was not found.');
  }

  return member;
}

async function loginUi(page, email, password) {
  await page.goto(`${frontendBaseUrl}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/member/),
    page.locator('button[type="submit"]').click()
  ]);
}

async function fillRegistration(page, values) {
  await page.locator('input[placeholder="Jonathan Sterling"]').fill(values.fullName);
  await page.locator('input[placeholder="member@yorinternational.com"]').fill(values.email);
  await page.locator('input[placeholder="+63 900 000 0000"]').fill(values.phone);
  await page.locator('input[placeholder="Create account password"]').fill(values.password);
  await page.locator('input[placeholder="Confirm password"]').fill(values.password);
}

async function previewRegistration(page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/registration/preview') &&
      response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /Preview Registration/i }).click();
  const response = await responsePromise;
  return response.json();
}

async function submitRegistration(page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/registration/submit') &&
      response.request().method() === 'POST'
  );
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /Register Now/i }).first().click();
  await page.getByRole('button', { name: /Create Account/i }).click();
  const response = await responsePromise;
  await page.waitForTimeout(900);
  return response.json();
}

async function runReferralLinkScenario(browser) {
  await resetSandbox();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();

  await loginUi(page, 'member@yor.local', 'YorMember123!');
  await page.goto(`${frontendBaseUrl}/member/upgrade-registration`, { waitUntil: 'networkidle' });
  await Promise.all([
    page.waitForURL(/\/register\?/),
    page.getByRole('link', { name: /Open Registration/i }).click()
  ]);

  const sponsorReadonly = await page
    .locator('input[placeholder="YL-8839-GOLD"]')
    .evaluate((element) => element.hasAttribute('readonly'));
  const preferredSideLocked = await page.locator('select').isDisabled();

  await page.screenshot({
    path: path.join(outputDir, '01-referral-link-locked.png'),
    fullPage: true
  });

  await fillRegistration(page, {
    fullName: 'Referral Flow Prospect',
    email: 'referral.flow.prospect@example.test',
    phone: '+63 900 111 3301',
    password: 'Sandbox123!'
  });

  const preview = await previewRegistration(page);

  await page.screenshot({
    path: path.join(outputDir, '02-referral-link-preview.png'),
    fullPage: true
  });

  const submitResult = await submitRegistration(page);
  const state = await loadSandboxState();
  const createdMember = findMember(
    state,
    (member) => member.email === 'referral.flow.prospect@example.test'
  );
  const sponsor = findMember(state, (member) => member.username === 'YOR0001');
  const placementParent = findMember(state, (member) => member.username === 'YOR0002');
  const sponsorLedger = state.walletLedgerEntries.find(
    (entry) =>
      entry.memberUsername === 'YOR0001' &&
      entry.entryType === 'direct_referral' &&
      entry.sourceReference === createdMember.username
  );

  await page.screenshot({
    path: path.join(outputDir, '03-referral-link-success.png'),
    fullPage: true
  });

  await context.close();

  return {
    name: 'referral-link',
    uiChecks: {
      sponsorReadonly,
      preferredSideLocked
    },
    previewPlacement: preview.placement,
    submitResult,
    stateChecks: {
      createdUsername: createdMember.username,
      sponsorCode: createdMember.sponsorCode,
      placementParentUsername: createdMember.placementParentUsername,
      placementSide: createdMember.placement,
      sponsorWalletAvailable: sponsor.walletAvailable,
      placementParentRightPoints: placementParent.rightPoints,
      sponsorLeftPoints: sponsor.leftPoints,
      sponsorLedgerCredit: sponsorLedger?.creditAmount ?? null
    }
  };
}

async function runManualSlotScenario(browser) {
  await resetSandbox();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1400 } });
  const page = await context.newPage();

  await loginUi(page, 'member@yor.local', 'YorMember123!');
  await page.goto(`${frontendBaseUrl}/member/genealogy`, { waitUntil: 'networkidle' });

  const canvasPrompt = page.getByText(/Click or touch the tree to engage drag, zoom, and fullscreen controls/i);

  if (await canvasPrompt.isVisible().catch(() => false)) {
    await canvasPrompt.click();
  }

  await page.locator('.genealogy-canvas-node.is-open-slot').nth(3).click();
  await page.waitForURL(/placementParentUsername=YOR0003/);

  const sponsorReadonly = await page
    .locator('input[placeholder="YL-8839-GOLD"]')
    .evaluate((element) => element.hasAttribute('readonly'));
  const preferredSideLocked = await page.locator('select').isDisabled();

  await page.screenshot({
    path: path.join(outputDir, '04-manual-slot-locked-placement.png'),
    fullPage: true
  });

  await fillRegistration(page, {
    fullName: 'Manual Slot Prospect',
    email: 'manual.slot.prospect@example.test',
    phone: '+63 900 111 3302',
    password: 'Sandbox123!'
  });

  const preview = await previewRegistration(page);

  await page.screenshot({
    path: path.join(outputDir, '05-manual-slot-preview.png'),
    fullPage: true
  });

  const submitResult = await submitRegistration(page);
  const state = await loadSandboxState();
  const createdMember = findMember(
    state,
    (member) => member.email === 'manual.slot.prospect@example.test'
  );
  const sponsor = findMember(state, (member) => member.username === 'YOR0001');
  const placementParent = findMember(state, (member) => member.username === 'YOR0003');
  const sponsorLedger = state.walletLedgerEntries.find(
    (entry) =>
      entry.memberUsername === 'YOR0001' &&
      entry.entryType === 'direct_referral' &&
      entry.sourceReference === createdMember.username
  );

  await page.screenshot({
    path: path.join(outputDir, '06-manual-slot-success.png'),
    fullPage: true
  });

  await context.close();

  return {
    name: 'manual-slot',
    uiChecks: {
      sponsorReadonly,
      preferredSideLocked
    },
    previewPlacement: preview.placement,
    submitResult,
    stateChecks: {
      createdUsername: createdMember.username,
      sponsorCode: createdMember.sponsorCode,
      placementParentUsername: createdMember.placementParentUsername,
      placementSide: createdMember.placement,
      sponsorWalletAvailable: sponsor.walletAvailable,
      placementParentLeftPoints: placementParent.leftPoints,
      sponsorRightPoints: sponsor.rightPoints,
      sponsorLedgerCredit: sponsorLedger?.creditAmount ?? null
    }
  };
}

async function main() {
  await ensureDir(outputDir);
  const browser = await chromium.launch({ headless: true });

  try {
    const referralLink = await runReferralLinkScenario(browser);
    const manualSlot = await runManualSlotScenario(browser);
    const summary = {
      generatedAt: new Date().toISOString(),
      outputDir,
      scenarios: [referralLink, manualSlot]
    };

    await fs.writeFile(
      path.join(outputDir, 'playwright-can-encode-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf8'
    );

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
