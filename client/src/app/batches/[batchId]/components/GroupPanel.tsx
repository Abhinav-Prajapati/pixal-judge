'use client'
import { useBatchStore } from "../store/useBatchStore"; // Adjust this import path
import { OpenAPI } from "@/api"; // Adjust this import path

// --- Reusable Image Component (Simplified) ---
function ClusterImage({ imageId }: { imageId: number; }) {
  return (
    <div
      className="w-28 h-40 relative overflow-hidden shadow-md bg-base-300"
    >
      <img
        src={`${OpenAPI.BASE}/images/thumbnail/${imageId}`}
        alt={`Image ${imageId}`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/112x160/eee/ccc?text=Error'; }}
      />
    </div>
  );
}


export function GroupPanel() {
  // Get state and the selector function from the store
  const { loading, error, getClusterEntries } = useBatchStore();

  // Call the selector to get the processed cluster data
  const clusterEntries = getClusterEntries();

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (error) {
      return <div className="flex items-center justify-center h-full text-error">Error: {error}</div>;
    }

    if (clusterEntries.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-base-content/60">
          <p>No clusters to display.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-row flex-wrap items-start gap-4">
        {clusterEntries.map(([clusterId, imageIds]) => (
          <section key={clusterId} className="rounded-lg bg-white/5 p-3">
            <h2 className="mb-3">
              Cluster {clusterId}
              <span className="badge badge-outline badge-info ml-2 rounded-full text-sm">{imageIds.length} images</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {imageIds.map(id => (
                <ClusterImage key={id} imageId={id} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="card bg-base-300 text-white w-full h-full m-3 shadow-lg">
      <div className="card-body overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
