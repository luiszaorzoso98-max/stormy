// Detección del navegador para la guía de instalación, con user agents reales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIAS, ORDEN_GUIAS, detectaNavegador, enlaceChrome } from '../js/navegador.js';

const UA = {
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  ipadComoMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
  chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1',
  edgeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/139.3405.86 Mobile/15E148 Safari/605.1.15',
  firefoxIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/142.0 Mobile/15E148 Safari/605.1.15',
  whatsappIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/25.20.79',
  instagramIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 Instagram 394.0.0.46.81 (iPhone16,2; iOS 18_6; es_ES; es; scale=3.00; 1290x2796; 789327285)',
  facebookIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.0.0.42.104;FBBV/752349214;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/3;FBID/phone;FBLC/es_ES;FBOP/5]',
  gmailIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0.786713542 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 15; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.94 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 15; SAMSUNG SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 15; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0',
  edgeAndroid: 'Mozilla/5.0 (Linux; Android 15; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 EdgA/139.0.3405.86',
  tiktokAndroid: 'Mozilla/5.0 (Linux; Android 15; Pixel 8 Build/AP4A.250105.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 trill_390000 BytedanceWebview/d8a21c6',
  webviewAndroid: 'Mozilla/5.0 (Linux; Android 15; Pixel 8 Build/AP4A.250105.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36',
  chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  edgeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.3405.86',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
  firefoxWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
};

test('cada navegador va a su guía', () => {
  const casos = [
    ['safariIphone', 'ios', 'safari', null, 'safari-ios'],
    ['chromeIphone', 'ios', 'chrome', null, 'chrome-ios'],
    ['edgeIphone', 'ios', 'edge', null, 'otro-ios'],
    ['firefoxIphone', 'ios', 'firefox', null, 'otro-ios'],
    ['whatsappIphone', 'ios', 'safari', 'WhatsApp', 'inapp'],
    ['instagramIphone', 'ios', 'safari', 'Instagram', 'inapp'],
    ['facebookIphone', 'ios', 'safari', 'Facebook', 'inapp'],
    ['gmailIphone', 'ios', 'safari', 'Gmail', 'inapp'],
    ['chromeAndroid', 'android', 'chrome', null, 'android-chrome'],
    ['samsung', 'android', 'samsung', null, 'samsung'],
    ['firefoxAndroid', 'android', 'firefox', null, 'firefox-android'],
    ['edgeAndroid', 'android', 'edge', null, 'edge-android'],
    ['tiktokAndroid', 'android', 'chrome', 'TikTok', 'inapp'],
    ['webviewAndroid', 'android', 'chrome', 'otra app', 'inapp'],
    ['chromeMac', 'escritorio', 'chrome', null, 'escritorio-chrome'],
    ['edgeWindows', 'escritorio', 'edge', null, 'escritorio-edge'],
    ['safariMac', 'escritorio', 'safari', null, 'safari-mac'],
    ['firefoxWindows', 'escritorio', 'firefox', null, 'escritorio-otro'],
  ];
  for (const [ua, plataforma, navegador, app, guia] of casos) {
    assert.deepEqual(detectaNavegador(UA[ua]), { plataforma, navegador, app, standalone: false, guia }, ua);
  }
});

test('iPadOS se hace pasar por Mac: se reconoce por la pantalla táctil', () => {
  assert.equal(detectaNavegador(UA.ipadComoMac, { maxTouchPoints: 5 }).guia, 'safari-ios');
  assert.equal(detectaNavegador(UA.ipadComoMac, { maxTouchPoints: 0 }).guia, 'safari-mac');
});

test('instalada: se marca como standalone', () => {
  assert.equal(detectaNavegador(UA.safariIphone, { standalone: true }).standalone, true);
});

test('guías: todas tienen nombre y pasos, y el selector las ofrece todas', () => {
  const ofrecidas = ORDEN_GUIAS.flatMap(([, c]) => c);
  for (const [clave, g] of Object.entries(GUIAS)) {
    assert.ok(g.nombre, clave);
    if (!['safari-ios', 'inapp'].includes(clave)) assert.ok(g.pasos.length >= 1 && g.pasos.every(([t, x, d]) => t && x && d), clave);
    if (clave !== 'escritorio-otro') assert.ok(ofrecidas.includes(clave), clave);
  }
});

test('enlace para abrir en Chrome desde otra app (Android)', () => {
  assert.equal(enlaceChrome('https://luiszaorzoso98-max.github.io/stormy/'), 'intent://luiszaorzoso98-max.github.io/stormy/#Intent;scheme=https;package=com.android.chrome;end');
});
