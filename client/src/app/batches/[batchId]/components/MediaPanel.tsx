'use client'
import { useParams } from 'next/navigation';
import { usePanelStore } from "../store/useUiStore";
import { TabBar } from "./TabBar";
import { MediaView } from "./MediaView";
import { SettingsView } from "./SettingsView";

export function MediaPanel() {
  const { activeTab } = usePanelStore();
  const params = useParams();

  // 1. Get batchId here in the parent component
  const batchId = Number(params.batchId);

  return (
    <div className="flex flex-row card bg-base-300 text-white w-100 h-120 m-3">
      <TabBar />
      <div className="w-px bg-base-100" />
      <main className="flex-1 overflow-y-auto">
        {/* 2. Pass batchId as a prop to both children */}
        {activeTab === "media" && <MediaView batchId={batchId} />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}