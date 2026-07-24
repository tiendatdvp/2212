import { mkdir, writeFile } from "node:fs/promises";

const CDP = "http://127.0.0.1:9222";
const OUT = "docs/design-references/www.2212.vn";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
const client = await getClient();

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1300,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: "http://127.0.0.1:3000/" });
  await delay(1800);

  await evaluate(
    client,
    `new Promise((resolve) => {
      const user = document.querySelector('input[data-field="operative-id"]');
      const pass = document.querySelector('input[data-field="access-code"]');
      if (user && pass) {
        user.value = 'ID-GUEST';
        pass.value = 'p2212vn!';
        user.dispatchEvent(new Event('input', { bubbles: true }));
        pass.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('.gate__submit')?.click();
      }
      setTimeout(resolve, 3600);
    })`,
    true,
  );

  await evaluate(
    client,
    `new Promise((resolve) => {
      const files = [...document.querySelectorAll('.file')];
      const target = files.find((item) => item.innerText.includes('H3/H67')) || files[0];
      target?.scrollIntoView({ block: 'center' });
      setTimeout(() => {
        target?.click();
        setTimeout(resolve, 800);
      }, 300);
    })`,
    true,
  );

  const summary = await evaluate(
    client,
    `JSON.stringify({
      hasDossier: Boolean(document.querySelector('.dossier')),
      title: document.querySelector('.dossier__title')?.innerText,
      width: document.querySelector('.dossier')?.getBoundingClientRect().width,
      body: document.body.innerText.slice(0, 220)
    })`,
  );
  console.log(summary);

  await capture(client, `${OUT}/clone-detail-desktop.png`);
} finally {
  client.close();
}
