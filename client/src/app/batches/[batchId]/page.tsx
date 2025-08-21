'use client'
import { useEffect } from "react";
import { useBatchStore } from "./store/useBatchStore";
import { MediaPanel } from "./components/MediaPanel";
import { NavBar } from "./components/NavBar";
import { GroupPanel } from "./components/GroupPanel";

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
            <div className=" flex flex-row">
                <MediaPanel />
                <GroupPanel />
            </div>
        </main>
    );
}
