import { usePanelStore, tabs, Tab } from "../store/useUiStore";

export function TabBar() {
  const { activeTab, setActiveTab } = usePanelStore();
  return (
    <nav className="p-2 flex flex-col gap-2 pt-2">
      {(Object.keys(tabs) as Tab[]).map((key) => {
        const Icon = tabs[key].icon;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-1 py-2 rounded ${activeTab === key ? "text-primary" : "text-base-content/50"}`}
            title={tabs[key].label}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </nav>
  );
}