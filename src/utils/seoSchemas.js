import {
  absoluteUrl,
  SITE_NAME,
  DEFAULT_OG_IMAGE_PATH,
  getBrandSameAsUrls,
} from "../config/site.js";

/** Single @graph: Organization, WebSite, LocalBusiness, Services — injected once in App. */
export function buildGlobalJsonLd() {
  const url = absoluteUrl("/");
  const logo = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const orgId = `${url}#organization`;
  const sameAs = getBrandSameAsUrls();

  const organization = {
    "@type": "Organization",
    "@id": orgId,
    name: SITE_NAME,
    alternateName: ["Eyelens India", "Eyelens online store", "Eyelens eyewear"],
    url,
    logo: { "@type": "ImageObject", url: logo },
    description:
      "Official Eyelens ecommerce store for prescription eyeglasses, sunglasses, and computer glasses online in India — transparent pricing and reliable delivery.",
    ...(sameAs.length ? { sameAs } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: `${SITE_NAME} — Official store`,
        alternateName: SITE_NAME,
        url,
        publisher: { "@id": orgId },
        about: { "@id": orgId },
        inLanguage: "en-IN",
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/plp")}?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": `${url}#localbusiness`,
        name: SITE_NAME,
        image: logo,
        url,
        parentOrganization: { "@id": orgId },
        priceRange: "₹₹",
        address: { "@type": "PostalAddress", addressCountry: "IN" },
        areaServed: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Service",
        serviceType: "Prescription eyeglasses online",
        provider: { "@id": orgId },
        areaServed: { "@type": "Country", name: "IN" },
        description: "Browse frames, add lenses at checkout, and upload or save your prescription.",
      },
      {
        "@type": "Service",
        serviceType: "Sunglasses and UV eyewear",
        provider: { "@id": orgId },
        areaServed: { "@type": "Country", name: "IN" },
        description: "UV-protective sunglasses and lifestyle frames with fast shipping.",
      },
      {
        "@type": "Service",
        serviceType: "Blue light computer glasses",
        provider: { "@id": orgId },
        areaServed: { "@type": "Country", name: "IN" },
        description: "Screen-comfort lenses for work-from-home and daily device use.",
      },
    ],
  };
}

export function buildFaqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function buildProductJsonLd({
  name,
  brand,
  description,
  productUrl,
  imageUrls = [],
  price,
  /** MRP / list price when on sale (INR number) */
  listPrice,
  priceCurrency = "INR",
  availability = "https://schema.org/InStock",
  sku,
  aggregateRating,
  reviewSnippets = [],
}) {
  const images = (imageUrls || []).filter(Boolean).slice(0, 8);
  const offer = {
    "@type": "Offer",
    url: productUrl,
    priceCurrency,
    price: String(price),
    availability,
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
  if (listPrice != null && Number(listPrice) > Number(price)) {
    offer.priceSpecification = [
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/ListPrice",
        price: String(listPrice),
        priceCurrency,
      },
    ];
  }
  const obj = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: String(name || "").slice(0, 200),
    brand: { "@type": "Brand", name: String(brand || SITE_NAME).slice(0, 120) },
    description: String(description || "").slice(0, 5000),
    sku: String(sku || "").slice(0, 64),
    image: images.length ? images : undefined,
    offers: offer,
  };
  if (aggregateRating?.ratingValue != null && aggregateRating?.reviewCount != null) {
    const rc = Number(aggregateRating.reviewCount);
    if (rc > 0) {
      obj.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(aggregateRating.ratingValue),
        reviewCount: String(aggregateRating.reviewCount),
        bestRating: "5",
        worstRating: "1",
      };
    }
  }
  const revs = (reviewSnippets || []).filter((r) => r?.body && r?.authorName);
  if (revs.length) {
    obj.review = revs.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: String(r.authorName).slice(0, 80) },
      reviewBody: String(r.body).slice(0, 2000),
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(Math.min(5, Math.max(1, Number(r.rating) || 5))),
        bestRating: "5",
        worstRating: "1",
      },
    }));
  }
  return obj;
}

/** PLP: ItemList of visible product URLs (Google supports url + name on ListItem). */
export function buildItemListJsonLd({ name, pageUrl, items = [] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: name || "Eyewear catalogue",
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
