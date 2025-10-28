"use client";

import React from "react";
import { Button, ButtonGroup } from "@heroui/react";
import { Grid, LayoutGrid } from "lucide-react";
import { useViewStore } from "./viewStore";

export function NavToolBar({
  allImagesCount,
}: {
  allImagesCount: number;
}) {
  const { view, setView } = useViewStore();

  return (
    <nav className="flex flex-shrink-0 items-center gap-2 p-2 bg-content1 border-b border-default-200 sticky top-0 z-10 justify-end">
      <ButtonGroup>
        <Button
          variant={view === "all" ? "solid" : "bordered"}
          color="primary"
          onPress={() => setView("all")}
          startContent={<Grid size={18} />}
          radius="none"
        >
          All Images ({allImagesCount})
        </Button>
        <Button
          variant={view === "grouped" ? "solid" : "bordered"}
          color="primary"
          onPress={() => setView("grouped")}
          startContent={<LayoutGrid size={18} />}
          radius="none"
        >
          Grouped View
        </Button>
      </ButtonGroup>
    </nav>
  );
}