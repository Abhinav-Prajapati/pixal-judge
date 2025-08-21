'use client'
import { useEffect } from "react";
import { useBatchStore } from "./store/useBatchStore";
import { MediaPanel } from "./components/MediaPanel";
import { NavBar } from "./components/NavBar";

export default function Page({ params }: { params: { batchId: string } }) {
    const { fetchBatch } = useBatchStore();

    useEffect(() => {
        const id = parseInt(params.batchId, 10);
        if (!isNaN(id)) {
            fetchBatch(id);
        }
    }, [params.batchId, fetchBatch]);

    return (
        <main className="h-screen w-screen bg-background text-foreground overflow-hidden">
            <NavBar />
            <MediaPanel />
        </main>
    );
}
