import { mkdir, writeFile } from "node:fs/promises";

const CDP = "http://127.0.0.1:9222";
const OUT = "docs/research/www.2212.vn/authenticated";
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
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: "https://www.2212.vn/" });
  await delay(3500);

  await capture(client, `${SHOTS}/original-gate-desktop.png`);

  const loginResult = await evaluate(
    client,
    `new Promise((resolve) => {
      const user = document.querySelector('input[data-field="operative-id"]');
      const pass = document.querySelector('input[data-field="access-code"]');
      if (!user || !pass) {
        resolve({ ok: false, reason: 'inputs-not-found', text: document.body.innerText });
        return;
      }
      user.value = 'ID-GUEST';
      pass.value = 'p2212vn!';
      user.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form')?.requestSubmit();
      setTimeout(() => resolve({ ok: true, href: location.href, text: document.body.innerText }), 2600);
    })`,
    true,
  );

  await writeFile(`${OUT}/login-result.json`, JSON.stringify(loginResult, null, 2));
  await delay(4500);

  const extracted = await evaluate(
    client,
    `JSON.stringify({
      href: location.href,
      title: document.title,
      bodyText: document.body.innerText,
      html: document.documentElement.outerHTML,
      sections: [...document.querySelectorAll('header, main > *, section, footer')].map((el, index) => ({
        index,
        tag: el.tagName,
        className: String(el.className),
        id: el.id,
        text: el.innerText?.slice(0, 4000),
        rect: (() => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        })()
      })),
      links: [...document.querySelectorAll('a')].map(a => ({ text: a.innerText, href: a.href, className: String(a.className) })),
      buttons: [...document.querySelectorAll('button')].map(b => ({ text: b.innerText, className: String(b.className), pressed: b.getAttribute('aria-pressed') })),
      images: [...document.querySelectorAll('img')].map(img => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        className: String(img.className)
      })),
      backgrounds: [...document.querySelectorAll('*')].map(el => ({
        tag: el.tagName,
        className: String(el.className),
        backgroundImage: getComputedStyle(el).backgroundImage
      })).filter(x => x.backgroundImage && x.backgroundImage !== 'none'),
      fonts: [...new Set([...document.querySelectorAll('*')].slice(0, 300).map(el => getComputedStyle(el).fontFamily))],
      colors: [...new Set([...document.querySelectorAll('*')].slice(0, 300).flatMap(el => {
        const cs = getComputedStyle(el);
        return [cs.color, cs.backgroundColor, cs.borderColor].filter(Boolean);
      }))],
      svgCount: document.querySelectorAll('svg').length
    })`,
  );

  const parsed = JSON.parse(extracted);
  await writeFile(`${OUT}/page.html`, parsed.html);
  delete parsed.html;
  await writeFile(`${OUT}/extracted.json`, JSON.stringify(parsed, null, 2));
  await capture(client, `${SHOTS}/authenticated-desktop.png`);

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(1000);
  await capture(client, `${SHOTS}/authenticated-mobile.png`);

  console.log(JSON.stringify({
    href: parsed.href,
    title: parsed.title,
    sections: parsed.sections.length,
    images: parsed.images.length,
    buttons: parsed.buttons.length,
    links: parsed.links.length,
  }, null, 2));
} finally {
  client.close();
}
