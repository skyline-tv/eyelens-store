/**
 * Writes `public/sitemap.xml` and `public/robots.txt`.
 * Reads `VITE_SITE_URL` and `VITE_API_URL` from `.env` when present.
 * Fetches `/products` to include SEO-friendly product URLs (slug + id).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

const env = readEnvFile();
let base = env.VITE_SITE_URL?.trim()?.replace(/\/$/, "") || "http://localhost:3000";
const apiBase = env.VITE_API_URL?.trim() || "http://localhost:5000/api";

function slugify(text, maxLen = 56) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
}

function productLoc(id, name) {
  const pid = String(id || "").trim();
  if (!pid) return null;
  const slug = slugify(name);
  if (slug) return `/product/${slug}-${pid}`;
  return `/product/${pid}`;
}

const staticPaths = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/plp", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.7" },
  { loc: "/contact", changefreq: "monthly", priority: "0.6" },
];

async function fetchProductUrls() {
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/products`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const list = body?.data;
    if (!Array.isArray(list)) return [];
    return list
      .map((p) => {
        const id = p?._id || p?.id;
        const loc = productLoc(id, p?.name);
        if (!loc) return null;
        return { loc, changefreq: "weekly", priority: "0.8" };
      })
      .filter(Boolean);
  } catch (e) {
    console.warn("[write-sitemap] product fetch skipped:", e?.message || e);
    return [];
  }
}

const productPaths = await fetchProductUrls();
const allPaths = [...staticPaths, ...productPaths];

const urls = allPaths
  .map(
    (p) => `  <url>
    <loc>${base}${p.loc.startsWith("/") ? p.loc : `/${p.loc}`}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = path.join(root, "public", "sitemap.xml");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, xml, "utf8");
console.log("[write-sitemap] wrote", out, "base=", base, "products=", productPaths.length);

const robots = `User-agent: *
Allow: /

Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /order/

Sitemap: ${base}/sitemap.xml
`;
const robotsOut = path.join(root, "public", "robots.txt");
fs.writeFileSync(robotsOut, robots, "utf8");
console.log("[write-sitemap] wrote", robotsOut);
