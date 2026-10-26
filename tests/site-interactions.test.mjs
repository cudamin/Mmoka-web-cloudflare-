import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const script = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'main.js'), 'utf8');
const themes = ['forest', 'black', 'midnight', 'graphite', 'violet'];

function element(attributes = {}, classes = []) {
    const values = { ...attributes };
    const classNames = new Set(classes);
    const events = new Map();
    return {
        open: false,
        textContent: '',
        scrollCalls: 0,
        getAttribute: name => values[name],
        setAttribute: (name, value) => { values[name] = value; },
        addEventListener: (name, callback) => events.set(name, callback),
        emit: name => events.get(name)?.(),
        scrollIntoView() { this.scrollCalls++; },
        classList: {
            add: name => classNames.add(name),
            contains: name => classNames.has(name),
            toggle(name, enabled) {
                if (enabled) classNames.add(name);
                else classNames.delete(name);
            }
        }
    };
}

function fixture({ savedTheme = null, hash = '', unavailableStorage = false, reducedMotion = true, scrollY = 0 } = {}) {
    const body = element();
    const preview = element();
    const header = element();
    const name = element();
    const status = element();
    const swatches = themes.map(theme => element({ 'data-set-theme': theme }));
    const faq = element({}, ['faq-item', 'reveal']);
    const nonFaq = element();
    const link = element();
    link.hash = '#faq-translation-formats';
    const ids = new Map([['theme-name', name], ['theme-status', status], ['faq-translation-formats', faq], ['download', nonFaq]]);
    const storage = new Map(savedTheme === null ? [] : [['momoka-theme', savedTheme]]);
    const windowEvents = new Map();
    const window = {
        location: { hash }, scrollY,
        matchMedia: () => ({ matches: reducedMotion }),
        addEventListener: (name, callback) => windowEvents.set(name, callback)
    };
    const document = {
        body,
        getElementById: id => ids.get(id) ?? null,
        querySelector: selector => ({ '.theme-preview': preview, '.site-header': header })[selector] ?? null,
        querySelectorAll: selector => ({ '.swatch': swatches, '.reveal': [preview, faq], 'a[href^="#faq-"]': [link] })[selector] ?? []
    };
    runInNewContext(script, {
        window, document,
        localStorage: {
            getItem(key) {
                if (unavailableStorage) throw new Error('Storage unavailable');
                return storage.get(key) ?? null;
            },
            setItem(key, value) {
                if (unavailableStorage) throw new Error('Storage unavailable');
                storage.set(key, value);
            }
        }
    });
    return { body, preview, header, name, status, swatches, faq, link, storage, window, emitWindow: name => windowEvents.get(name)?.() };
}

function assertTheme(ui, theme) {
    assert.equal(ui.body.getAttribute('data-theme'), theme);
    assert.equal(ui.preview.getAttribute('data-theme'), theme);
    assert.equal(ui.swatches.filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
    assert.equal(ui.swatches.find(button => button.getAttribute('data-set-theme') === theme).getAttribute('aria-pressed'), 'true');
}

test('default theme, readable fallback and initially collapsed FAQ remain available', () => {
    const ui = fixture();
    assertTheme(ui, 'forest');
    assert.equal(ui.name.textContent, '墨绿');
    assert.equal(ui.status.textContent, '当前主题：墨绿');
    assert.equal(ui.faq.open, false);
    assert.ok(ui.faq.classList.contains('is-visible'));
    assert.equal(ui.window.__momokaReady, true);
});

test('theme changes update the page, preview, accessible state and persisted preference', () => {
    const ui = fixture();
    const labels = ['墨绿', '纯黑', '午夜', '石墨', '紫夜'];
    ui.swatches.forEach((button, index) => {
        button.emit('click');
        assertTheme(ui, themes[index]);
        assert.equal(ui.name.textContent, labels[index]);
        assert.equal(ui.status.textContent, '当前主题：' + labels[index]);
        assert.equal(ui.storage.get('momoka-theme'), themes[index]);
    });
});

test('valid saved themes restore while unknown saved values fall back safely', () => {
    for (const theme of themes) assertTheme(fixture({ savedTheme: theme }), theme);
    assertTheme(fixture({ savedTheme: 'unrecognized' }), 'forest');
});

test('blocked local storage does not prevent changing the current theme or opening an answer', () => {
    const ui = fixture({ unavailableStorage: true });
    ui.swatches[4].emit('click');
    assertTheme(ui, 'violet');
    ui.link.emit('click');
    assert.equal(ui.faq.open, true);
});

test('direct FAQ fragments open the answer and scroll to it', () => {
    const ui = fixture({ hash: '#faq-translation-formats' });
    assert.equal(ui.faq.open, true);
    assert.equal(ui.faq.scrollCalls, 1);
    assert.ok(ui.faq.classList.contains('is-visible'));
});

test('clicking the same FAQ link reopens a manually closed answer without changing hash', () => {
    const ui = fixture({ hash: '#faq-translation-formats' });
    ui.faq.open = false;
    ui.link.emit('click');
    assert.equal(ui.faq.open, true);
});

test('hash changes open answers, while other anchors and malformed fragments are harmless', () => {
    const ui = fixture();
    for (const hash of ['#download', '#missing', '#%broken', '#__proto__', '']) {
        ui.window.location.hash = hash;
        assert.doesNotThrow(() => ui.emitWindow('hashchange'));
        assert.equal(ui.faq.open, false);
    }
    ui.window.location.hash = '#faq-translation-formats';
    ui.emitWindow('hashchange');
    assert.equal(ui.faq.open, true);
    assert.equal(ui.faq.scrollCalls, 1);
});

test('the header responds to scrolling and the no-observer fallback exposes content', () => {
    const ui = fixture({ reducedMotion: false });
    assert.equal(ui.header.classList.contains('is-scrolled'), false);
    ui.window.scrollY = 100;
    ui.emitWindow('scroll');
    assert.equal(ui.header.classList.contains('is-scrolled'), true);
    ui.window.scrollY = 0;
    ui.emitWindow('scroll');
    assert.equal(ui.header.classList.contains('is-scrolled'), false);
    assert.ok(ui.preview.classList.contains('is-visible'));
});
