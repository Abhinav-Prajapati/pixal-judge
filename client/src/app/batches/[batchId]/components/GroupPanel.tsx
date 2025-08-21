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
      <div className="space-y-6 p-4">
        {clusterEntries.map(([clusterId, imageIds]) => (
          <section key={clusterId}>
            <h2 className="text-lg font-bold mb-2">
              Cluster {clusterId}
              <span className="badge badge-ghost ml-2">{imageIds.length} images</span>
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
    <div className="card bg-base-100 text-white w-full h-full m-3 shadow-lg">
      <div className="card-body overflow-y-auto">
        <h1 className="card-title border-b border-base-300 pb-2">Image Groups</h1>
        {renderContent()}
      </div>
    </div>
  );
}
