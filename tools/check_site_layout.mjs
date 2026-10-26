import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function optionsOf(args) {
    const options = { root: resolve(dirname(fileURLToPath(import.meta.url)), '..') };
    for (let index = 0; index < args.length; index++) {
        const key = args[index];
        if (key === '--help') return { help: true };
        assert.ok(['--root', '--output-dir', '--playwright-module', '--browser-executable'].includes(key), 'Unknown option: ' + key);
        const value = args[++index];
        assert.ok(value && !value.startsWith('--'), 'Missing value for ' + key);
        options[key.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = value;
    }
    options.root = resolve(options.root);
    options.outputDir = resolve(options.outputDir ?? join(options.root, '.preview', 'layout'));
    return options;
}

function inside(directory, file) {
    const path = relative(directory, file);
    return path !== '..' && !path.startsWith('..\\') && !path.startsWith('../') && !isAbsolute(path);
}

async function serve(directory) {
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png' };
    const server = createServer(async (request, response) => {
        try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
            const file = resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
            if (!inside(directory, file)) { response.writeHead(403); response.end(); return; }
            const bytes = await readFile(file);
            response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
            response.end(bytes);
        } catch {
            response.writeHead(404);
            response.end('Not found');
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return { server, url: 'http://127.0.0.1:' + server.address().port + '/' };
}

async function checkPage(page, columns, width, errors) {
    await page.waitForFunction(() => window.__momokaReady === true);
    const layout = await page.evaluate(() => {
        const columnsOf = selector => getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(' ').length;
        const overflow = [...document.querySelectorAll('main p, main h3, main a, summary, .swatch, .server-card, .pipeline, .requirements, .getting-started')]
            .filter(item => !item.closest('.sr-only') && item.getClientRects().length)
            .filter(item => item.getBoundingClientRect().left < -1 || item.getBoundingClientRect().right > innerWidth + 1 || item.scrollWidth > item.clientWidth + 1)
            .map(item => item.id || item.className || item.tagName);
        const cardTops = [...document.querySelectorAll('.server-card')].map(item => Math.round(item.getBoundingClientRect().top));
        const linkBottoms = [...document.querySelectorAll('.server-footer')].map(item => Math.round(item.getBoundingClientRect().bottom));
        const badImages = [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.getAttribute('src'));
        const badTargets = [...document.querySelectorAll('a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash);
        return { documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, height: document.documentElement.scrollHeight, servers: columnsOf('.server-grid'), features: columnsOf('.feature-list'), overflow, badImages, badTargets, faqOpen: [...document.querySelectorAll('.faq-item')].filter(item => item.open).length, cardTops, linkBottoms, text: document.body.innerText };
    });
    assert.ok(layout.documentWidth <= layout.viewportWidth, 'Horizontal page overflow at ' + width);
    assert.deepEqual(layout.overflow, [], 'Component overflow at ' + width);
    assert.deepEqual(layout.badImages, [], 'Broken images');
    assert.deepEqual(layout.badTargets, [], 'Broken internal links');
    assert.equal(layout.servers, columns.servers, 'Wrong server card columns at ' + width);
    assert.equal(layout.features, columns.features, 'Wrong feature columns at ' + width);
    assert.equal(layout.faqOpen, 0, 'FAQ should be initially collapsed');
    assert.doesNotMatch(layout.text, /\bv?\d+\.\d+\.\d+\b|候选版|尚未提交|发布暂缓/);
    for (let index = 0; index < layout.cardTops.length; index++) {
        for (let other = index + 1; other < layout.cardTops.length; other++) {
            if (layout.cardTops[index] === layout.cardTops[other]) assert.ok(Math.abs(layout.linkBottoms[index] - layout.linkBottoms[other]) <= 1, 'Server footers not aligned');
        }
    }
    assert.deepEqual(errors, [], 'Runtime errors');
    delete layout.text;
    return layout;
}

async function main() {
    const options = optionsOf(process.argv.slice(2));
    if (options.help) {
        console.log('Usage: node tools/check_site_layout.mjs [--root <site>] [--output-dir <path>] [--playwright-module <entry.js>] [--browser-executable <browser>]');
        return;
    }
    await readFile(join(options.root, 'dist', 'index.html'));
    await mkdir(options.outputDir, { recursive: true });
    const require = createRequire(import.meta.url);
    const { chromium } = options.playwrightModule ? require(resolve(options.playwrightModule)) : await import('playwright');
    const { server, url } = await serve(join(options.root, 'dist'));
    let browser;
    const report = { pass: false, checks: [], screenshotDirectory: options.outputDir };
    try {
        browser = await chromium.launch({ headless: true, ...(options.browserExecutable ? { executablePath: resolve(options.browserExecutable) } : {}) });
        // Keep every fixture on the loopback origin; tests never follow download links.
        async function localContext(options) {
            const context = await browser.newContext(options);
            await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort());
            return context;
        }
        const viewports = [
            { width: 1440, height: 1000, servers: 4, features: 2 },
            { width: 1280, height: 900, servers: 4, features: 2 },
            { width: 1080, height: 900, servers: 2, features: 2 },
            { width: 960, height: 900, servers: 2, features: 2 },
            { width: 768, height: 1024, servers: 2, features: 2 },
            { width: 720, height: 1000, servers: 1, features: 1 },
            { width: 390, height: 844, servers: 1, features: 1 },
            { width: 320, height: 800, servers: 1, features: 1 }
        ];
        for (const viewport of viewports) {
            const context = await localContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url, { waitUntil: 'networkidle' });
            const layout = await checkPage(page, viewport, viewport.width, errors);
            await page.screenshot({ path: join(options.outputDir, 'layout-' + viewport.width + '.png'), fullPage: true });
            report.checks.push({ name: 'layout-' + viewport.width, pass: true, layout });
            await context.close();
        }
        const context = await localContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url, { waitUntil: 'networkidle' });
        const labels = { forest: '墨绿', black: '纯黑', midnight: '午夜', graphite: '石墨', violet: '紫夜' };
        for (const [theme, label] of Object.entries(labels)) {
            await page.locator('[data-set-theme="' + theme + '"]').click();
            assert.equal(await page.locator('body').getAttribute('data-theme'), theme);
            assert.equal(await page.locator('.theme-preview').getAttribute('data-theme'), theme);
            assert.equal(await page.locator('.swatch[aria-pressed="true"]').count(), 1);
            assert.equal(await page.locator('#theme-status').textContent(), '当前主题：' + label);
            await page.locator('#interface').screenshot({ path: join(options.outputDir, 'theme-' + theme + '.png') });
        }
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('body').getAttribute('data-theme'), 'violet');
        await page.evaluate(() => localStorage.setItem('momoka-theme', 'invalid'));
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('body').getAttribute('data-theme'), 'forest');
        report.checks.push({ name: 'five-themes-persistence-and-invalid-fallback', pass: true });
        await page.locator('#faq-translation-privacy summary').focus();
        assert.equal(await page.locator('#faq-translation-privacy summary').evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#faq-translation-privacy').evaluate(element => element.open), true);
        await page.keyboard.press('Space');
        assert.equal(await page.locator('#faq-translation-privacy').evaluate(element => element.open), false);
        report.checks.push({ name: 'keyboard-focus-and-native-faq-toggle', pass: true });
        for (const [source, target] of [['#subtitles .feature-link', 'faq-translation-formats'], ['#frame-interpolation .feature-link', 'faq-interpolation'], ['#moviepilot .feature-link', 'faq-subscriptions']]) {
            await page.goto(url, { waitUntil: 'networkidle' });
            await page.locator(source).click();
            assert.equal(new URL(page.url()).hash, '#' + target);
            assert.equal(await page.locator('#' + target).evaluate(element => element.open), true);
            assert.ok(await page.locator('#' + target).evaluate(element => element.getBoundingClientRect().top >= 70), 'FAQ hidden under header');
            await page.locator('#' + target + ' summary').click();
            await page.locator(source).click();
            assert.equal(await page.locator('#' + target).evaluate(element => element.open), true);
        }
        await page.goto(url + '#faq-translation-privacy', { waitUntil: 'networkidle' });
        assert.equal(await page.locator('#faq-translation-privacy').evaluate(element => element.open), true);
        await page.goto(url + '#%broken', { waitUntil: 'networkidle' });
        assert.deepEqual(errors, []);
        await page.goto(url, { waitUntil: 'networkidle' });
        for (const item of await page.locator('.faq-item').all()) await item.locator('summary').click();
        await page.locator('#faq').scrollIntoViewIfNeeded();
        await page.locator('#faq').evaluate(element => window.scrollTo(0, element.offsetTop - 100));
        await page.locator('#faq').screenshot({ path: join(options.outputDir, 'faq-expanded.png') });
        report.checks.push({ name: 'faq-links-direct-fragments-repeat-open-and-malformed-hash', pass: true });
        await context.close();
        for (const settings of [{ javaScriptEnabled: false, name: 'no-javascript' }, { javaScriptEnabled: true, name: 'blocked-local-storage', blockStorage: true }]) {
            const fallback = await localContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', javaScriptEnabled: settings.javaScriptEnabled });
            if (settings.blockStorage) await fallback.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked storage'); } }));
            const fallbackPage = await fallback.newPage();
            const failures = [];
            fallbackPage.on('pageerror', error => failures.push(error.message));
            await fallbackPage.goto(url, { waitUntil: 'networkidle' });
            if (settings.blockStorage) {
                await fallbackPage.locator('[data-set-theme="midnight"]').click();
                assert.equal(await fallbackPage.locator('body').getAttribute('data-theme'), 'midnight');
            }
            await fallbackPage.locator('#faq-translation-formats summary').click();
            assert.equal(await fallbackPage.locator('#faq-translation-formats').evaluate(element => element.open), true);
            assert.equal(await fallbackPage.locator('#subtitles').evaluate(element => getComputedStyle(element).opacity), '1');
            assert.deepEqual(failures, []);
            report.checks.push({ name: settings.name, pass: true });
            await fallback.close();
        }
        const motionContext = await localContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
        const motionPage = await motionContext.newPage();
        await motionPage.goto(url, { waitUntil: 'networkidle' });
        await motionPage.locator('#moviepilot').scrollIntoViewIfNeeded();
        await motionPage.waitForFunction(() => document.querySelector('#moviepilot').classList.contains('is-visible'));
        report.checks.push({ name: 'normal-motion-scroll-reveals-content', pass: true });
        await motionContext.close();
        report.pass = true;
        console.log('PASS: ' + report.checks.length + ' browser checks; screenshots: ' + options.outputDir);
    } catch (error) {
        report.error = error.message;
        throw error;
    } finally {
        await writeFile(join(options.outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => { console.error('FAIL: ' + error.message); process.exitCode = 1; });
