import { ChevronDown, ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { useBatchStore } from "../store/useBatchStore";

export function NavBar() {
  const { batch, loading } = useBatchStore();

  return (
    <div className="pl-2 pt-1">
      <details className="dropdown">
        <summary className="btn m-1 flex items-center gap-2">
          <ChevronDown className="w-4 h-4" />
          {loading ? "Loading..." : batch?.batch_name || "Unnamed Project"}
        </summary>
        <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
          <li>
            <a>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Batch
            </a>
          </li>
          <li>
            <a>
              <Edit3 className="w-4 h-4 mr-2" />
              Rename
            </a>
          </li>
          <li>
            <a className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </a>
          </li>
        </ul>
      </details>
    </div>
  );
}
