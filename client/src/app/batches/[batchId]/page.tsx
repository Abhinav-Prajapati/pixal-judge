'use client'
import { useParams } from 'next/navigation';
import { BatchHeader } from './components/BatchHeader';
import { GroupPanel } from './components/GroupPanel';
import { MediaPanel } from './components/MediaPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useCurrentBatch } from './hooks/useCurrentBatch';

export default function Page() {
  const params = useParams();
  const batchId = Number(Array.isArray(params.batchId) ? params.batchId[0] : params.batchId);
  const { data: batch, isLoading, error } = useCurrentBatch(batchId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading batch</div>;
  if (!batch) return <div>Batch not found.</div>;

  return (
    <main className="h-screen w-screen bg-neutral text-foreground overflow-hidden flex flex-col">
      <BatchHeader batch={batch} />
      <div className="flex flex-row flex-1 min-h-0">
        <MediaPanel batch={batch} />
        <GroupPanel batch={batch} />
        <SettingsPanel batch={batch} />
      </div>
    </main>
  );
}