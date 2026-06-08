"use client";

import { ArrowRight } from "lucide-react";
import type { WeatherKind, WeatherPattern } from "@/lib/weather";

type Props = {
  iconKey?: string;
  primary: WeatherKind;
  secondary?: WeatherKind;
  pattern: WeatherPattern;
  icons: Partial<Record<WeatherKind, string | null>>;
  detailedIcons?: Record<string, string>;
};

function FallbackIcon({ kind }: { kind: WeatherKind }) {
  if (kind === "sunny") {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="4" />
        <g stroke="currentColor" strokeLinecap="round" strokeWidth="4">
          <path d="M60 12v16" />
          <path d="M60 92v16" />
          <path d="m26 26 11 11" />
          <path d="m83 83 11 11" />
          <path d="M12 60h16" />
          <path d="M92 60h16" />
          <path d="m26 94 11-11" />
          <path d="m83 37 11-11" />
        </g>
      </svg>
    );
  }

  if (kind === "rainy") {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <path d="M22 62a38 38 0 0 1 76 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
        <path d="M22 62c8-9 16-9 24 0 8-9 16-9 24 0 8-9 16-9 28 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path d="M60 24v-9" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
        <path d="M60 62v42c0 10 17 10 17-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
      </svg>
    );
  }

  if (kind === "snow") {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4">
          <path d="M60 18v84" />
          <path d="M24 39l72 42" />
          <path d="M96 39 24 81" />
          <path d="m46 26 14 12 14-12" />
          <path d="m46 94 14-12 14 12" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <path d="M34 78h55a23 23 0 0 0-4-46 29 29 0 0 0-54 14 17 17 0 0 0 3 32Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </svg>
  );
}

function IconItem({ kind, icons }: { kind: WeatherKind; icons: Partial<Record<WeatherKind, string | null>> }) {
  const icon = icons[kind];
  return (
    <span className="weatherIconItem">
      {icon ? <img src={icon} alt="" /> : <FallbackIcon kind={kind} />}
    </span>
  );
}

export function WeatherIcon({ iconKey, primary, secondary, pattern, icons, detailedIcons = {} }: Props) {
  const detailedIcon = iconKey ? detailedIcons[iconKey] : null;

  if (detailedIcon) {
    return (
      <div className="weatherIcon weatherIcon-detailed">
        <span className="weatherIconItem weatherIconItem-detailed">
          <img src={detailedIcon} alt="" />
        </span>
      </div>
    );
  }

  return (
    <div className={`weatherIcon weatherIcon-${pattern}`}>
      <IconItem kind={primary} icons={icons} />
      {secondary && pattern === "then" ? (
        <>
          <ArrowRight className="weatherArrow" aria-hidden="true" strokeWidth={1.8} />
          <IconItem kind={secondary} icons={icons} />
        </>
      ) : null}
      {secondary && pattern === "sometimes" ? <IconItem kind={secondary} icons={icons} /> : null}
      {secondary && pattern === "sometimes" ? <ArrowRight className="weatherSubArrow" aria-hidden="true" strokeWidth={1.8} /> : null}
    </div>
  );
}
