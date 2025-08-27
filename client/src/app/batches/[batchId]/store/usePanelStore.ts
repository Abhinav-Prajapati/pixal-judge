// src/store/usePanelStore.ts
import { create } from "zustand";
import { Image as ImageIcon, LucideIcon, Settings } from "lucide-react";

export type Tab = "media" | "settings";

export const tabs: Record<Tab, { icon: LucideIcon; label: string }> = {
  media: {
    icon: ImageIcon,
    label: "Media",
  },
  settings: {
    icon: Settings,
    label: "Settings",
  },
};

interface PanelStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  mediaItems: any[]; // Consider typing this more specifically
  addMediaItem: (item: any) => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  activeTab: "media",
  setActiveTab: (tab) => set({ activeTab: tab }),
  mediaItems: [],
  addMediaItem: (item) => set((state) => ({ mediaItems: [...state.mediaItems, item] })),
}));