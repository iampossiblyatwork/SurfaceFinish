import type { ReactNode } from "react";

interface LessonProps {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}

/** Consistent wrapper for the reference/training pages. */
export function Lesson({ title, intro, children }: LessonProps) {
  return (
    <article className="lesson">
      <h1 className="lesson-title">{title}</h1>
      {intro && <p className="lesson-intro">{intro}</p>}
      {children}
    </article>
  );
}

/** A highlighted aside used for definitions and key takeaways. */
export function Callout({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <aside className="lesson-callout">
      {label && <span className="lesson-callout-label">{label}</span>}
      <div>{children}</div>
    </aside>
  );
}

export interface NextStepItem {
  id: string;
  label: string;
  note?: string;
}

/** Consistent "where to go next" footer so a reader is never stranded. */
export function NextSteps({
  onNavigate,
  items,
}: {
  onNavigate?: (id: string) => void;
  items: NextStepItem[];
}) {
  if (!onNavigate) return null;
  return (
    <nav className="next-steps" aria-label="Next steps">
      <span className="next-steps-title">Next</span>
      <div className="next-steps-list">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className="next-step"
            onClick={() => onNavigate(it.id)}
          >
            <span className="next-step-text">
              <span className="next-step-label">{it.label}</span>
              {it.note && <span className="next-step-note">{it.note}</span>}
            </span>
            <span className="next-step-arrow" aria-hidden>
              →
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
