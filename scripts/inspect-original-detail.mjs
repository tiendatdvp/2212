import { mkdir, writeFile } from "node:fs/promises";

const CDP = "http://127.0.0.1:9222";
const URL = "https://www.2212.vn/ho-so/h-ky-1-h3-h67-bong-ma-thanh-sai-gon";
const OUT = "docs/research/www.2212.vn/detail";
const SHOTS = "docs/design-references/www.2212.vn";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getPageWebSocket() {
  const tabs = await fetch(`${CDP}/json`).then((response) => response.json());
  const page = tabs.find((tab) => tab.type === "page") ?? tabs[0];

  if (!page?.webSocketDebuggerUrl) {
    throw new Error("No debuggable Chrome page found");
  }

  return page.webSocketDebuggerUrl;
}

function createClient(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(JSON.stringify(message.error)));
      } else {
        resolve(message.result);
      }
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const commandId = ++id;
          socket.send(JSON.stringify({ id: commandId, method, params }));
          return new Promise((commandResolve, commandReject) => {
            pending.set(commandId, {
              resolve: commandResolve,
              reject: commandReject,
            });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener("error", reject);
  });
}

async function evaluate(client, expression, awaitPromise = false) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }

  return result.result.value;
}

async function capture(client, path) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  await writeFile(path, Buffer.from(result.data, "base64"));
}

await mkdir(OUT, { recursive: true });
await mkdir(SHOTS, { recursive: true });

const client = await createClient(await getPageWebSocket());

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1300,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send("Page.navigate", { url: "https://www.2212.vn/" });
  await delay(2500);

  await evaluate(
    client,
    `new Promise((resolve) => {
      const user = document.querySelector('input[data-field="operative-id"]');
      const pass = document.querySelector('input[data-field="access-code"]');
      if (!user || !pass) {
        resolve({ ok: true, reason: 'already-auth-or-no-gate', href: location.href });
        return;
      }
      user.value = 'ID-GUEST';
      pass.value = 'p2212vn!';
      user.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form')?.requestSubmit();
      setTimeout(() => resolve({ ok: true, href: location.href }), 4500);
    })`,
    true,
  );
  await delay(2500);

  await client.send("Page.navigate", { url: URL });
  await delay(4500);

  const extracted = await evaluate(
    client,
    `JSON.stringify((() => {
      const props = [
        'display','gridTemplateColumns','gap','position','top','left','right','bottom','zIndex',
        'width','maxWidth','height','minHeight','padding','margin','background','backgroundColor',
        'border','borderTop','borderBottom','boxShadow','overflow','fontFamily','fontSize',
        'fontWeight','lineHeight','letterSpacing','color','textTransform','objectFit','filter'
      ];
      const readStyles = (el) => {
        const cs = getComputedStyle(el);
        return Object.fromEntries(props.map((name) => [name, cs[name]]).filter(([, value]) => value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px' && value !== 'rgba(0, 0, 0, 0)'));
      };
      const walk = (el, depth = 0) => {
        if (!el || depth > 4) return null;
        const children = [...el.children];
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: String(el.className),
          text: children.length === 0 ? el.textContent.trim().slice(0, 260) : null,
          rect: (() => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          })(),
          styles: readStyles(el),
          image: el.tagName === 'IMG' ? { src: el.currentSrc || el.src, alt: el.alt, naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight } : null,
          children: children.slice(0, 24).map((child) => walk(child, depth + 1)).filter(Boolean),
        };
      };
      const candidates = [...document.querySelectorAll('main, article, section, header, .file, [class*="file"], [class*="prose"], [class*="article"]')];
      return {
        href: location.href,
        title: document.title,
        bodyText: document.body.innerText,
        html: document.documentElement.outerHTML,
        candidates: candidates.map((el) => ({
          tag: el.tagName,
          id: el.id,
          className: String(el.className),
          text: el.innerText?.slice(0, 1600),
          rect: (() => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          })(),
        })),
        tree: walk(document.querySelector('main') || document.body),
      };
    })())`,
  );

  const parsed = JSON.parse(extracted);
  await writeFile(`${OUT}/detail.html`, parsed.html);
  delete parsed.html;
  await writeFile(`${OUT}/detail-extracted.json`, JSON.stringify(parsed, null, 2));
  await capture(client, `${SHOTS}/original-detail-desktop.png`);

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(1200);
  await capture(client, `${SHOTS}/original-detail-mobile.png`);

  console.log(JSON.stringify({
    href: parsed.href,
    title: parsed.title,
    candidates: parsed.candidates.length,
    hasGate: parsed.bodyText.includes("SECURE GATEWAY"),
    bodySample: parsed.bodyText.slice(0, 260),
  }, null, 2));
} finally {
  client.close();
}
