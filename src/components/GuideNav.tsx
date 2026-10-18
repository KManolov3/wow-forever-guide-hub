import { useEffect, useRef, useState } from "react";

export interface GuideSection {
  id: string;
  label: string;
}

interface Props {
  /** Sections the bar jumps to, in page order. */
  sections: readonly GuideSection[];
  /** The number field at the start of the bar, e.g. the player's level. */
  field: { id: string; label: string; max: number; value: string; onChange: (value: string) => void };
}

/** Id of the last section whose top has scrolled up to the navigation bar, or the last one at the page bottom. */
function sectionInView(sections: readonly GuideSection[], navBottom: number): string {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) return sections[sections.length - 1].id;
  let current = sections[0].id;
  for (const { id } of sections) {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= navBottom + 40) current = id;
  }
  return current;
}

/** A bar that stays at the top of a guide with a number field and buttons that jump to its sections. */
export function GuideNav({ sections, field }: Props) {
  const nav = useRef<HTMLElement>(null);
  const links = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(sections[0].id);

  // On narrow screens the links scroll sideways; keep the current one visible.
  useEffect(() => {
    const list = links.current;
    const button = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !button) return;
    const left = button.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + button.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: left - 16, behavior: "smooth" });
    }
  }, [active]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setActive(sectionInView(sections, nav.current?.getBoundingClientRect().bottom ?? 0)),
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const jump = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
    setActive(id);
    // Content above can still change height (fonts, images) while the smooth scroll runs; line up again at the end.
    window.addEventListener(
      "scrollend",
      () => {
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (Math.abs(target.getBoundingClientRect().top - margin) > 4) target.scrollIntoView({ block: "start" });
      },
      { once: true },
    );
  };

  return (
    <nav ref={nav} className="guide-nav" aria-label="Guide sections">
      <form className="level-jump" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor={field.id}>{field.label}</label>
        <input
          id={field.id}
          type="number"
          inputMode="numeric"
          min={1}
          max={field.max}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder={`1–${field.max}`}
        />
      </form>
      <ul ref={links} className="guide-nav-links">
        {sections.map((s) => (
          <li key={s.id}>
            <button aria-current={active === s.id ? "true" : undefined} onClick={() => jump(s.id)}>
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
