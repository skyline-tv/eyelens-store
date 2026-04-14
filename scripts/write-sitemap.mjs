/**
 * Writes `public/sitemap.xml` using `VITE_SITE_URL` from `.env` (falls back to localhost).
 * Run automatically before `vite build` via `prebuild`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let base = "http://localhost:3000";
try {
  const envPath = path.join(root, ".env");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    const m = raw.match(/^\s*VITE_SITE_URL\s*=\s*(.+)\s*$/m);
    if (m) {
      base = m[1].trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
    }
  }
} catch {
  /* ignore */
}

const paths = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/plp", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.7" },
  { loc: "/contact", changefreq: "monthly", priority: "0.6" },
];

const urls = paths
  .map(
    (p) => `  <url>
    <loc>${base}${p.loc}</loc>
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
console.log("[write-sitemap] wrote", out, "base=", base);

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
