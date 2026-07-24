import { mkdir, writeFile } from "node:fs/promises";

const CDP = "http://127.0.0.1:9222";
const OUT = "docs/research/www.2212.vn/authenticated/structured.json";

async function getClient() {
  const tabs = await fetch(`${CDP}/json`).then((response) => response.json());
  const page = tabs.find((tab) => tab.type === "page") ?? tabs[0];
  const socket = new WebSocket(page.webSocketDebuggerUrl);
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

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    send(method, params = {}) {
      const commandId = ++id;
      socket.send(JSON.stringify({ id: commandId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(commandId, { resolve, reject });
      });
    },
    close() {
      socket.close();
    },
  };
}

const client = await getClient();

try {
  await client.send("Runtime.enable");
  const value = await client.send("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `new Promise((resolve) => {
      function text(el, selector) {
        return el.querySelector(selector)?.innerText?.trim() || "";
      }
      function image(el) {
        const img = el.querySelector("img");
        return img ? { src: img.currentSrc || img.src, alt: img.alt } : null;
      }
      function card(selector) {
        return [...document.querySelectorAll(selector)].map((el) => ({
          className: String(el.className),
          href: el.href || "",
          text: el.innerText.trim(),
          image: image(el),
        }));
      }
      resolve(JSON.stringify({
        files: card(".file"),
        docs: card(".doc-card"),
        genericCards: card(".card"),
        sponsorCards: card(".sponsor-card"),
        gear: card(".gear"),
        allies: card(".ally-card"),
        figures: card(".cmd-fig"),
        header: document.querySelector(".arc-header")?.innerText.trim(),
        footer: document.querySelector(".arc-footer")?.innerText.trim()
      }));
    })`,
  });

  await mkdir("docs/research/www.2212.vn/authenticated", { recursive: true });
  await writeFile(OUT, JSON.stringify(JSON.parse(value.result.value), null, 2));
  console.log(OUT);
} finally {
  client.close();
}
