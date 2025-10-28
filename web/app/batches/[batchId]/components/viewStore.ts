import { create } from "zustand";

type ViewState = {
  view: "all" | "grouped";
  setView: (view: "all" | "grouped") => void;
};

export const useViewStore = create<ViewState>((set) => ({
  view: "all",
  setView: (newView) => set({ view: newView }),
}));