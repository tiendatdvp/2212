import { mkdir, writeFile } from "node:fs/promises";

const CDP = "http://127.0.0.1:9222";
const OUT = "docs/design-references/www.2212.vn";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getClient() {
  const tabs = await fetch(`${CDP}/json`).then((response) => response.json());
  const localTabs = tabs
    .filter((tab) => tab.type === "page")
    .filter((tab) => tab.url?.startsWith("http://127.0.0.1:3000"));
  const page =
    localTabs.at(-1) ??
    tabs.find((tab) => tab.type === "page") ??
    tabs[0];
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
  try {
    const result = await client.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(path, Buffer.from(result.data, "base64"));
  } catch (error) {
    console.error(`Screenshot skipped: ${error.message}`);
  }
}

await mkdir(OUT, { recursive: true });
const client = await getClient();

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: "http://127.0.0.1:3000/" });
  await delay(1500);
  const hasGate = await evaluate(
    client,
    `Boolean(document.querySelector('input[data-field="operative-id"]') && document.querySelector('input[data-field="access-code"]'))`,
  );

  if (hasGate) {
    await evaluate(
    client,
    `new Promise((resolve) => {
      document.querySelector('input[data-field="operative-id"]').value = 'ID-GUEST';
      document.querySelector('input[data-field="access-code"]').value = 'p2212vn!';
      document.querySelector('.gate__submit').click();
      setTimeout(resolve, 3200);
    })`,
    true,
    );
  }
  const summary = await evaluate(
    client,
    `JSON.stringify({
      text: document.body.innerText.slice(0, 500),
      files: document.querySelectorAll('.file').length,
      docs: document.querySelectorAll('.doc-card').length,
      cards: document.querySelectorAll('.card').length,
      height: document.documentElement.scrollHeight
    })`,
  );
  console.log(summary);

  await capture(client, `${OUT}/clone-authenticated-desktop.png`);

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(1000);
  await capture(client, `${OUT}/clone-authenticated-mobile.png`);
} finally {
  client.close();
}
