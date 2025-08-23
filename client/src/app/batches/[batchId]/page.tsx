'use client'
import { useEffect } from "react";
import { useBatchStore } from "./store/useBatchStore";
import { MediaPanel } from "./components/MediaPanel";
import { NavBar } from "./components/NavBar";
import { GroupPanel } from "./components/GroupPanel";
import { client } from "@/client/client.gen";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({
  baseUrl: API_BASE_URL
});

export default function Page({ params }: { params: { batchId: string } }) {
  const { fetchBatch } = useBatchStore();

  useEffect(() => {
    const id = parseInt(params.batchId, 10);
    if (!isNaN(id)) {
      fetchBatch(id);
    }
  }, [params.batchId, fetchBatch]);

  return (
    <main className="h-screen w-screen bg-neutral text-foreground overflow-hidden">
      <NavBar />
      <div className=" flex flex-row h-max">
        <MediaPanel />
        <GroupPanel />
      </div>
    </main>
  );
}
