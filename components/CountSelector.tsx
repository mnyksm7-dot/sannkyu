"use client";

import { STAMP_COUNT_OPTIONS } from "@/lib/lineStamp";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export default function CountSelector({ value, onChange }: Props) {
  return (
    <div className="count-options">
      {STAMP_COUNT_OPTIONS.map((count) => (
        <button
          type="button"
          key={count}
          className={`count-option${value === count ? " selected" : ""}`}
          onClick={() => onChange(count)}
        >
          {count}枚
        </button>
      ))}
    </div>
  );
}
