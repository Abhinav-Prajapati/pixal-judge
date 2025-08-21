import { create } from "zustand";
import { Image, LucideIcon, Settings } from "lucide-react";
export type Tab = "media" | "settings"; 

export const tabs: Record<Tab, { icon: LucideIcon; label: string }> = {
  media: {
    icon: Image,
    label: "Media",
  },
  settings: {
    icon: Settings,
    label: "Settings",
  },}

interface PanelStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  mediaItems: any[];
  addMediaItem: (item: any) => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  activeTab: "media",
  setActiveTab: (tab) => set({ activeTab: tab }),
  mediaItems: [],
  addMediaItem: (item) => set((state) => ({ mediaItems: [...state.mediaItems, item] })),
}));