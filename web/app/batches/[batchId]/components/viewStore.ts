import { create } from "zustand";
import { ImageResponse } from "@/client/types.gen";

type ViewState = {
  view: "all" | "grouped";
  detailImage: ImageResponse | null;
  setView: (view: "all" | "grouped") => void;
  showImageDetails: (image: ImageResponse) => void;
  closeImageDetails: () => void;
};

export const useViewStore = create<ViewState>((set) => ({
  view: "all",
  detailImage: null,
  setView: (newView) => set({ view: newView }),
  showImageDetails: (image) => set({ detailImage: image }),
  closeImageDetails: () => set({ detailImage: null }),
}));