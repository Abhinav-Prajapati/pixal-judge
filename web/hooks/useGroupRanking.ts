import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { rankGroupImagesMutation } from "@/client/@tanstack/react-query.gen";

export function useGroupRanking() {
  const [currentGroup, setCurrentGroup] = useState<string | null>(null);
  const mutation = useMutation(rankGroupImagesMutation());

  const rankGroup = async (
    batchId: number,
    groupLabel: string,
    metric: string = "brisque",
  ) => {
    setCurrentGroup(groupLabel);
    try {
      const result = await mutation.mutateAsync({
        path: { batch_id: batchId, group_label: groupLabel },
        query: { metric },
      });

      return result;
    } finally {
      setCurrentGroup(null);
    }
  };

  return {
    rankGroup,
    isRanking: mutation.isPending,
    rankingGroup: currentGroup,
  };
}
