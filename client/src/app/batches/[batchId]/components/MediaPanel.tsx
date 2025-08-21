'use client'
import { usePanelStore } from "../store/useUiStore";
import { TabBar } from "./TabBar";
import { MediaView } from "./MediaView";
import { SettingsView } from "./SettingsView";


export function MediaPanel() {
  const { activeTab } = usePanelStore();

  return (
    <div className="flex flex-row card bg-base-300 text-white w-100 h-120 m-3">
      <TabBar />
      <div className="w-px bg-base-100" />
      <main className="flex-1 overflow-y-auto">
        {activeTab === "media" && <MediaView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}