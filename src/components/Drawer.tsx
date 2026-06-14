import { NAVIGATION } from "../data/navigation";

interface DrawerProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
  /** Mobile open state; ignored on desktop where the drawer is always shown. */
  open: boolean;
  onClose: () => void;
}

export function Drawer({ activePage, onNavigate, open, onClose }: DrawerProps) {
  return (
    <>
      <div
        className={`drawer-backdrop${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden
      />
      <aside className={`app-drawer${open ? " open" : ""}`} aria-label="Sections">
        <nav className="drawer-nav">
          {NAVIGATION.map((node) => {
            const isGroup = !!node.children;
            const groupActive = isGroup
              ? node.children!.some((c) => c.id === activePage)
              : node.id === activePage;

            if (!isGroup) {
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`drawer-item top${groupActive ? " active" : ""}`}
                  aria-current={groupActive}
                  onClick={() => onNavigate(node.id)}
                >
                  <span className="drawer-icon" aria-hidden>{node.icon}</span>
                  <span>{node.label}</span>
                </button>
              );
            }

            return (
              <div key={node.id} className="drawer-group">
                <div className="drawer-group-title">
                  <span className="drawer-icon" aria-hidden>{node.icon}</span>
                  <span>{node.label}</span>
                </div>
                {node.children!.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    className={`drawer-item child${
                      child.id === activePage ? " active" : ""
                    }`}
                    aria-current={child.id === activePage}
                    onClick={() => onNavigate(child.id)}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
