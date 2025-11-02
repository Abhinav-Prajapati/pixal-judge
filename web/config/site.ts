const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "PIXSORT",
  description: "An image curation tool.",
  urls: {
    apiBase: apiBaseUrl,
    projectDetails: (id: number | string) => `/batches/${id}`,
    imageThumbnail: (id: number | string) =>
      `${apiBaseUrl}/images/thumbnail/${id}`,
    image: (id: number | string) => `${apiBaseUrl}/images/${id}`,
  },
};
