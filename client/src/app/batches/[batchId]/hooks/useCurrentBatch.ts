import { useQuery } from '@tanstack/react-query';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';

export const useCurrentBatch = (batchId: number) => {
  return useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });
};