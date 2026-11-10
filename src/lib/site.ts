export const site = {
  name: "Scrap Bays Limited",
  shortName: "Scrap Bays",
  legalName: "Scrap Bays Limited",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://scrapbaysltd.com").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@scrapbaysltd.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+44 7985 714297",
  tagline: "Scrap metal, plastic, electronic scrap & recyclable materials — traded worldwide",
  description:
    "Scrap Bays Limited is a UK trading company supplying ferrous and non-ferrous scrap metal, metal ingots, electronic scrap, plastic scrap, motor parts scrap and timber to industrial buyers worldwide.",
  logo: "/icons/logo-512.png",
  country: "GB",
  themeColor: "#14532d",
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const absUrl = (p: string) => (p.startsWith("http") ? p : `${site.url}${p.startsWith("/") ? "" : "/"}${p}`);
