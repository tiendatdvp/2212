import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const assets = [
  {
    url: "https://api.2212.vn/api/media/file/2212VN-LG-3-removebg-preview.png",
    path: "public/images/2212/2212VN-LG-3-removebg-preview.png",
  },
  {
    url: "https://www.2212.vn/design/logo.png",
    path: "public/seo/logo.png",
  },
  {
    url: "https://www.2212.vn/2212-archive-og.webp",
    path: "public/seo/2212-archive-og.webp",
  },
];

function safeName(url, index) {
  const parsed = new URL(url);
  const raw = decodeURIComponent(path.basename(parsed.pathname));
  const ext = path.extname(raw) || ".bin";
  const base = raw
    .slice(0, raw.length - ext.length)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

  return `${String(index + 1).padStart(2, "0")}-${base || "asset"}${ext}`;
}

async function getAuthenticatedAssets() {
  try {
    const raw = await readFile(
      "docs/research/www.2212.vn/authenticated/extracted.json",
      "utf8",
    );
    const extracted = JSON.parse(raw);
    const urls = [
      ...new Set(
        extracted.images
          .map((image) => image.src)
          .filter((src) => src && src.startsWith("http")),
      ),
    ];

    return urls.map((url, index) => ({
      url,
      path: `public/images/2212/archive/${safeName(url, index)}`,
    }));
  } catch {
    return [];
  }
}

async function downloadAsset(asset) {
  const response = await fetch(asset.url);

  if (!response.ok) {
    throw new Error(`Failed ${response.status} ${asset.url}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(asset.path.split("/").slice(0, -1).join("/"), { recursive: true });
  await writeFile(asset.path, bytes);
}

const authenticatedAssets = await getAuthenticatedAssets();
const allAssets = [...assets, ...authenticatedAssets];

for (let index = 0; index < allAssets.length; index += 4) {
  await Promise.all(allAssets.slice(index, index + 4).map(downloadAsset));
}

console.log(`Downloaded ${allAssets.length} assets`);
