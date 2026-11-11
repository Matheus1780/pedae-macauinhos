"""Production PWA verification: manifest, browser eligibility, install UI and offline recovery.

Run after npm run export:web. Uses Python Playwright and installed Chromium.
Actual OS installation and physical iOS/Android devices need separate testing.
"""
import functools
import json
import os
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
output = Path(os.environ.get('ARTIFACT_DIR', '/tmp/pedeae-pwa'))
output.mkdir(parents=True, exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = urlparse(self.path).path
        if not Path(route).suffix and not (dist / route.lstrip('/')).is_file():
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(dist)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://localhost:{server.server_port}'
with sync_playwright() as p:
    profile = tempfile.TemporaryDirectory(prefix='pedeae-pwa-test-')
    context = p.chromium.launch_persistent_context(profile.name, executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'], viewport={'width': 390, 'height': 844})
    browser = context.browser
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(base + '/install', wait_until='networkidle')
    expect(page.get_by_text('Tenha o PedeAê por perto', exact=True)).to_be_visible()
    assert page.locator('html').get_attribute('lang') == 'pt-BR'
    manifest = page.evaluate('async () => (await fetch("/manifest.webmanifest")).json()')
    assert manifest['display'] == 'standalone' and manifest['scope'] == '/'
    for icon in manifest['icons']:
        result = page.evaluate('''async src => {
          const img = new Image(); img.src = src; await img.decode();
          return [img.naturalWidth, img.naturalHeight];
        }''', icon['src'])
        assert 'x'.join(map(str, result)) == icon['sizes']
    page.evaluate('async () => { await navigator.serviceWorker.ready; }')
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    cdp = context.new_cdp_session(page)
    result = cdp.send('Page.getAppManifest')
    assert not result['errors'], result
    eligibility = cdp.send('Page.getInstallabilityErrors')
    assert not eligibility['installabilityErrors'], eligibility
    page.screenshot(path=str(output / 'instalar-computador.png'))
    # Exercise both outcomes without pretending a mock installs an OS app.
    for outcome in ['dismissed', 'accepted']:
        page.evaluate('''outcome => {
          const event = new Event('beforeinstallprompt', {cancelable:true});
          event.prompt = async () => { window.promptCalled = true; };
          event.userChoice = Promise.resolve({outcome});
          window.dispatchEvent(event);
        }''', outcome)
        page.get_by_role('button', name='Instalar PedeAê', exact=True).click()
        assert page.evaluate('window.promptCalled')
        text = 'Você pode instalar depois pelo menu do navegador.' if outcome == 'dismissed' else 'Instalação solicitada. Aguarde a confirmação do navegador.'
        expect(page.get_by_text(text, exact=True)).to_be_visible()
    page.evaluate("window.dispatchEvent(new Event('appinstalled'))")
    expect(page.get_by_text('PedeAê no seu dispositivo', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name='Instalar PedeAê', exact=True)).to_have_count(0)
    cache = page.evaluate('''async () => {
      const names = await caches.keys();
      return (await Promise.all(names.filter(n => n.startsWith('pedeae-')).map(async n =>
        (await (await caches.open(n)).keys()).map(r => new URL(r.url).pathname)))).flat();
    }''')
    assert cache == ['/offline.html'], cache
    context.set_offline(True)
    page.reload(wait_until='domcontentloaded')
    expect(page.get_by_role('heading', name='Vamos nos reconectar?')).to_be_visible()
    page.screenshot(path=str(output / 'sem-conexao.png'))
    context.set_offline(False)
    page.get_by_role('button', name='Tentar novamente').click()
    expect(page.get_by_text('Tenha o PedeAê por perto', exact=True)).to_be_visible()
    ios = browser.new_context(user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', viewport={'width': 390, 'height': 844})
    ios_page = ios.new_page()
    ios_page.goto(base + '/install', wait_until='networkidle')
    expect(ios_page.get_by_text('No Safari, toque em Compartilhar', exact=False)).to_be_visible()
    ios_page.screenshot(path=str(output / 'instalar-iphone.png'))
    assert not errors, errors
    print('PASS: manifest/icons, Chromium installability, prompt accept/dismiss, installed event, offline recovery, iPhone instructions; no JS errors')
    browser.close()
    profile.cleanup()
server.shutdown()
