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
