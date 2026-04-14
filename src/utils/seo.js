import { absoluteUrl, SITE_NAME, DEFAULT_OG_IMAGE_PATH } from "../config/site.js";

const DEFAULT_TITLE = `${SITE_NAME} | Premium eyewear online India`;
const DEFAULT_DESC =
  "Shop prescription glasses, sunglasses & computer glasses at Eyelens. Honest pricing, COD, easy returns & lens options at checkout.";

function clampChars(str, max) {
  const t = String(str ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

function upsertMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function upsertLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeLink(rel) {
  document.querySelector(`link[rel="${rel}"]`)?.remove();
}

/**
 * @param {object} opts
 * @param {string} [opts.title] — full document title (max 60 chars)
 * @param {string} [opts.description] — meta description (max 155 chars)
 * @param {string} [opts.canonicalPath] — path + optional query, e.g. `/plp` or `/product/abc`
 * @param {boolean} [opts.noindex]
 * @param {string} [opts.keywords]
 * @param {string} [opts.ogImage] — absolute URL
 * @param {object|object[]} [opts.jsonLd]
 */
export function setPageSeo({
  title,
  description,
  canonicalPath,
  noindex = false,
  keywords,
  ogImage,
  jsonLd,
} = {}) {
  if (typeof document === "undefined") return () => {};

  const fullTitle = clampChars(title || DEFAULT_TITLE, 60);
  const desc = clampChars(description || DEFAULT_DESC, 155);
  document.title = fullTitle;

  upsertMeta("name", "description", desc);
  if (keywords) upsertMeta("name", "keywords", clampChars(keywords, 200));
  else document.querySelector('meta[name="keywords"]')?.remove();

  const pathForOg =
    canonicalPath ||
    (typeof window !== "undefined" ? `${window.location.pathname || "/"}${window.location.search || ""}` : "/");
  const ogUrl = absoluteUrl(pathForOg.split("#")[0]);
  const ogImg = ogImage || absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  upsertMeta("property", "og:title", fullTitle);
  upsertMeta("property", "og:description", desc);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:url", ogUrl);
  upsertMeta("property", "og:image", ogImg);
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:locale", "en_IN");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", fullTitle);
  upsertMeta("name", "twitter:description", desc);
  upsertMeta("name", "twitter:image", ogImg);

  let robots = document.querySelector('meta[name="robots"]');
  if (noindex) {
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
  } else {
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  }

  if (canonicalPath != null && canonicalPath !== "") {
    upsertLink("canonical", absoluteUrl(String(canonicalPath).split("#")[0]));
  } else {
    removeLink("canonical");
  }

  const ldScripts = [];
  const ldPayloads = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  ldPayloads.forEach((data, i) => {
    const id = `eyelens-jsonld-${Date.now()}-${i}`;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    ldScripts.push(script);
  });

  return () => {
    document.title = DEFAULT_TITLE;
    upsertMeta("name", "description", DEFAULT_DESC);
    document.querySelector('meta[name="keywords"]')?.remove();
    upsertMeta("property", "og:title", DEFAULT_TITLE);
    upsertMeta("property", "og:description", DEFAULT_DESC);
    upsertMeta("property", "og:url", absoluteUrl("/"));
    upsertMeta("property", "og:image", absoluteUrl(DEFAULT_OG_IMAGE_PATH));
    upsertMeta("name", "twitter:title", DEFAULT_TITLE);
    upsertMeta("name", "twitter:description", DEFAULT_DESC);
    upsertMeta("name", "twitter:image", absoluteUrl(DEFAULT_OG_IMAGE_PATH));
    if (robots) {
      robots.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }
    removeLink("canonical");
    ldScripts.forEach((s) => s.remove());
  };
}
