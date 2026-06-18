// Drawer navigation model. Top-level items are either a "page" (no children)
// or a "group" whose children are pages. Page ids map to a component in App's
// renderPage(). Kept as pure UI config — no data fetching here.

export interface NavChild {
  id: string;
  label: string;
}

export interface NavNode {
  id: string;
  label: string;
  icon: string;
  /** Present → this node is a group of pages; absent → the node is itself a page. */
  children?: NavChild[];
}

export const NAVIGATION: NavNode[] = [
  {
    id: "fundamentals",
    label: "Fundamentals",
    icon: "◎",
    children: [
      { id: "fund-overview", label: "What is surface finish?" },
      { id: "fund-chain", label: "The ISO processing chain" },
    ],
  },
  {
    id: "realworld",
    label: "Meeting Spec in the Real World",
    icon: "⚑",
  },
  {
    id: "callouts",
    label: "Callouts & Standards",
    icon: "▣",
  },
  {
    id: "filtering",
    label: "Filtering",
    icon: "∿",
    children: [
      { id: "filt-cutoffs", label: "Cutoffs & sampling length" },
      { id: "filt-fft", label: "Sine waves & the FFT" },
      { id: "filt-transmission", label: "Gaussian transmission" },
      { id: "filt-choosing", label: "Choosing a cutoff" },
    ],
  },
  {
    id: "profilers",
    label: "Surface Finish Profilers",
    icon: "▤",
    children: [
      { id: "prof-amplitude", label: "Amplitude parameters" },
      { id: "prof-spacing", label: "Spacing parameters" },
      { id: "prof-hybrid", label: "Hybrid parameters" },
      { id: "prof-material", label: "Material ratio curve" },
    ],
  },
  {
    id: "threed",
    label: "3D Surface Finish",
    icon: "⬢",
  },
  {
    id: "stylus",
    label: "Stylus Tip Geometry",
    icon: "✎",
  },
  {
    id: "tools",
    label: "Tools",
    icon: "↻",
    children: [
      { id: "tool-generator", label: "Trace generator" },
      { id: "tool-finishes", label: "Finishes gallery" },
      { id: "tool-compare", label: "Compare finishes" },
      { id: "tool-chart", label: "Roughness comparison" },
    ],
  },
];

/** Default page shown on first load. */
export const DEFAULT_PAGE = "fund-overview";

/** Flatten to a list of every page id (leaf) for validation / lookup. */
export const ALL_PAGE_IDS: string[] = NAVIGATION.flatMap((n) =>
  n.children ? n.children.map((c) => c.id) : [n.id],
);

/** Human label for a page id, used in the header breadcrumb. */
export function pageLabel(pageId: string): string {
  for (const node of NAVIGATION) {
    if (node.id === pageId && !node.children) return node.label;
    const child = node.children?.find((c) => c.id === pageId);
    if (child) return child.label;
  }
  return "";
}
