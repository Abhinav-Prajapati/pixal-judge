const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Next.js + HeroUI",
  description: "Make beautiful websites regardless of your design experience.",
  urls: {
    apiBase: apiBaseUrl,
    projectDetails: (id: number | string) => `/batches/${id}`, // Or `/projects/${id}`
    imageThumbnail: (id: number | string) => `${apiBaseUrl}/images/thumbnail/${id}`,
  }
};