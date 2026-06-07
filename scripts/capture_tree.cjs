const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting backend...');
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: 'C:/Users/Win10/Desktop/YorLegacyMLM/yor_backend',
    shell: true
  });

  backend.stdout.on('data', (data) => console.log(`[Backend] ${data.toString().trim()}`));
  backend.stderr.on('data', (data) => console.error(`[Backend Error] ${data.toString().trim()}`));

  console.log('Starting frontend...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: 'C:/Users/Win10/Desktop/YorLegacyMLM/yor_frontend',
    shell: true
  });

  frontend.stdout.on('data', (data) => console.log(`[Frontend] ${data.toString().trim()}`));
  frontend.stderr.on('data', (data) => console.error(`[Frontend Error] ${data.toString().trim()}`));

  // Wait for servers to spin up
  await new Promise((resolve) => setTimeout(resolve, 8000));

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    console.log('Navigating to login...');
    let port = 5173;
    try {
      await page.goto(`http://localhost:${port}/login`, { timeout: 5000 });
    } catch (e) {
      console.log('Failed to connect to 5173, trying 5174...');
      port = 5174;
      await page.goto(`http://localhost:${port}/login`);
    }

    await page.fill('#login-username', 'YOR0001');
    await page.fill('#login-password', 'YorMember123!');
    console.log('Submitting login...');
    await page.click('button[type="submit"]');

    console.log('Waiting for URL redirect...');
    await page.waitForURL('**/member', { timeout: 10000 });

    console.log('Navigating to genealogy...');
    await page.goto(`http://localhost:${port}/member/genealogy`);
    
    // Wait for the binary tree data to load
    await page.waitForSelector('.genealogy-canvas-viewport', { timeout: 15000 });
    
    console.log('Engaging canvas controls...');
    await page.click('.genealogy-canvas-viewport');
    await page.waitForTimeout(4000);

    const screenshotPath = 'C:/Users/Win10/.gemini/antigravity/brain/ba63e50d-dbfc-4579-ad76-70e53dca7edd/tree_screenshot.png';
    console.log(`Taking screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot taken!');

  } catch (error) {
    console.error('Test run failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('Terminating dev servers...');
    backend.kill();
    frontend.kill();
    
    try {
      spawn('taskkill', ['/F', '/T', '/PID', backend.pid]);
      spawn('taskkill', ['/F', '/T', '/PID', frontend.pid]);
    } catch (e) {}
  }
}

run();
