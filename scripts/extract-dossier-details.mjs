import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CDP = "http://127.0.0.1:9222";
const OUT_RESEARCH = "docs/research/www.2212.vn/detail";
const OUT_DATA = "src/data/dossier-details.json";
const OUT_IMAGES = "public/images/2212/dossiers";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugFromHref(href) {
  return new URL(href).pathname.split("/").filter(Boolean).at(-1);
}

function safeName(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
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
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
      else callbacks.resolve(message.result);
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

async function ensureAuthenticated(client) {
  await client.send("Page.navigate", { url: "https://www.2212.vn/" });
  await delay(2500);
  await evaluate(
    client,
    `new Promise((resolve) => {
      const user = document.querySelector('input[data-field="operative-id"]');
      const pass = document.querySelector('input[data-field="access-code"]');
      if (!user || !pass) {
        resolve({ ok: true, reason: 'already-authenticated' });
        return;
      }
      user.value = 'ID-GUEST';
      pass.value = 'p2212vn!';
      user.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form')?.requestSubmit();
      setTimeout(() => resolve({ ok: true }), 4600);
    })`,
    true,
  );
  await delay(2500);
}

async function downloadImage(src, slug, index) {
  if (!src) return null;

  const parsed = new URL(src);
  const rawName = decodeURIComponent(parsed.pathname.split("/").pop() ?? `${slug}.jpg`);
  const ext = path.extname(rawName) || ".jpg";
  const filename = `${String(index + 1).padStart(2, "0")}-${safeName(slug)}${ext}`;
  const publicPath = `/images/2212/dossiers/${filename}`;
  const localPath = path.join(OUT_IMAGES, filename);

  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(localPath, bytes);
    return publicPath;
  } catch (error) {
    console.warn(`Image download failed for ${slug}: ${error.message}`);
    return null;
  }
}

const archive = JSON.parse(await readFile("src/data/archive-structured.json", "utf8"));
const files = archive.files.map((file) => ({
  href: file.href,
  slug: slugFromHref(file.href),
}));

await mkdir(OUT_RESEARCH, { recursive: true });
await mkdir(OUT_IMAGES, { recursive: true });

const client = await createClient(await getPageWebSocket());
const details = [];

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1300,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await ensureAuthenticated(client);

  for (const [index, file] of files.entries()) {
    await client.send("Page.navigate", { url: file.href });
    await delay(2200);

    const raw = await evaluate(
      client,
      `JSON.stringify((() => {
        const dossier = document.querySelector('.dossier');
        const hero = document.querySelector('.dossier__hero');
        const paragraphs = [...document.querySelectorAll('.dossier__content p')].map((p) => p.innerText.trim());
        const meta = [...document.querySelectorAll('.dossier__meta > div')].map((item) => ({
          label: item.querySelector('span')?.innerText.trim() ?? '',
          value: item.querySelector('b')?.innerText.trim() ?? '',
          red: item.querySelector('b')?.classList.contains('red') ?? false,
        }));
        return {
          href: location.href,
          title: document.querySelector('.dossier__title')?.innerText.trim() ?? document.title,
          series: document.querySelector('.dossier__series')?.innerText.trim() ?? '',
          head: document.querySelector('.dossier__head')?.innerText.trim() ?? '',
          declassified: document.querySelector('.dossier__declassified')?.innerText.trim() ?? '',
          stamp: document.querySelector('.dossier__stamp')?.innerText.trim() ?? '',
          meta,
          hero: hero ? {
            src: hero.currentSrc || hero.src,
            alt: hero.alt,
            width: hero.naturalWidth,
            height: hero.naturalHeight,
          } : null,
          paragraphs,
          foot: document.querySelector('.dossier__foot')?.innerText.trim() ?? '',
          ok: Boolean(dossier),
          gate: Boolean(document.querySelector('input[data-field="operative-id"]')),
        };
      })())`,
    );

    const detail = JSON.parse(raw);
    const localHero = await downloadImage(detail.hero?.src, file.slug, index);
    details.push({
      slug: file.slug,
      ...detail,
      hero: detail.hero ? { ...detail.hero, localSrc: localHero } : null,
    });
    console.log(`${index + 1}/${files.length} ${file.slug}: ${detail.ok ? "ok" : "missing"}`);
  }
} finally {
  client.close();
}

const payload = {
  extractedAt: new Date().toISOString(),
  source: "https://www.2212.vn/",
  count: details.length,
  details,
};

await writeFile(OUT_DATA, JSON.stringify(payload, null, 2));
await writeFile(path.join(OUT_RESEARCH, "all-dossiers.json"), JSON.stringify(payload, null, 2));

console.log(JSON.stringify({
  count: details.length,
  ok: details.filter((item) => item.ok).length,
  withHero: details.filter((item) => item.hero?.localSrc).length,
}, null, 2));
