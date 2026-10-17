import { useState } from "react";

const ICON_BASE = "https://wow.zamimg.com/images/wow/icons/large";

interface IconProps {
  name?: string;
  label: string;
  size?: number;
  className?: string;
}

/** Game icon from the Wowhead CDN, falling back to the label's initials. */
export function Icon({ name, label, size = 40, className = "" }: IconProps) {
  const [failed, setFailed] = useState(false);
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className={`icon ${className}`} style={{ width: size, height: size }}>
      {name && !failed ? (
        <img src={`${ICON_BASE}/${name}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="icon-fallback">{initials}</span>
      )}
    </span>
  );
}
