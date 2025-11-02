import { client as baseClient } from "@/client/client.gen";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

baseClient.setConfig({ baseUrl: API_BASE_URL });

export const client = baseClient;
