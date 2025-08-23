'use client'
import { useEffect } from "react";
import { useParams } from 'next/navigation';
import { useBatchStore } from "./store/useBatchStore";
import { MediaPanel } from "./components/MediaPanel";
import { NavBar } from "./components/NavBar";
import { GroupPanel } from "./components/GroupPanel";
import { client } from "@/client/client.gen";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({
  baseUrl: API_BASE_URL
});

export default function Page() {
  const params = useParams();
  const { fetchBatch } = useBatchStore();

  useEffect(() => {
    const batchId = Array.isArray(params.batchId) ? params.batchId[0] : params.batchId;
    if (batchId) {
      const id = parseInt(batchId, 10);
      if (!isNaN(id)) {
        fetchBatch(id);
      }
    }
  }, [params.batchId, fetchBatch]);

  return (
    <main className="h-screen w-screen bg-neutral text-foreground overflow-hidden flex flex-col">
      <NavBar />
      <div className="flex flex-row flex-1 min-h-0">
        <MediaPanel />
        <GroupPanel />
      </div>
    </main>
  );
}