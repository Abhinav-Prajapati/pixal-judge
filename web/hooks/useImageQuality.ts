import { useMutation } from "@tanstack/react-query";
import { analyzeBatchQualityMutation } from "@/client/@tanstack/react-query.gen";

export function useImageQuality() {
  const mutation = useMutation(analyzeBatchQualityMutation());

  const analyzeQuality = async (imageIds: number[], metric: string = "brisque") => {
    return mutation.mutateAsync({
      body: imageIds,
      query: { metric },
    });
  };

  return {
    analyzeQuality,
    isAnalyzing: mutation.isPending,
    error: mutation.error,
  };
}
