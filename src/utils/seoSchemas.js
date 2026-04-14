import { absoluteUrl, SITE_NAME, DEFAULT_OG_IMAGE_PATH } from "../config/site.js";

/** Single @graph: Organization, WebSite, LocalBusiness, Services — injected once in App. */
export function buildGlobalJsonLd() {
  const url = absoluteUrl("/");
  const logo = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const orgId = `${url}#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_NAME,
        url,
        logo: { "@type": "ImageObject", url: logo },
        description:
          "Eyelens offers premium prescription eyeglasses, sunglasses, and computer glasses online in India with transparent pricing and reliable delivery.",
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: SITE_NAME,
        url,
        publisher: { "@id": orgId },
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
  priceCurrency = "INR",
  availability = "https://schema.org/InStock",
  sku,
  aggregateRating,
}) {
  const images = (imageUrls || []).filter(Boolean).slice(0, 8);
  const obj = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: String(name || "").slice(0, 200),
    brand: { "@type": "Brand", name: String(brand || SITE_NAME).slice(0, 120) },
    description: String(description || "").slice(0, 5000),
    sku: String(sku || "").slice(0, 64),
    image: images.length ? images : undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency,
      price: String(price),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  if (aggregateRating?.ratingValue != null && aggregateRating?.reviewCount != null) {
    obj.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(aggregateRating.ratingValue),
      reviewCount: String(aggregateRating.reviewCount),
      bestRating: "5",
      worstRating: "1",
    };
  }
  return obj;
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
