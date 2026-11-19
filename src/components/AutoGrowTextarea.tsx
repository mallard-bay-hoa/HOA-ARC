"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";

// Sizes the box to its content. When empty, size to the placeholder instead
// (browsers don't count it in scrollHeight), so a placeholder that wraps on a
// narrow screen isn't clipped. Swapping the value in briefly fires no events.
function resize(el: HTMLTextAreaElement) {
  const measurePlaceholder = el.value === "" && el.placeholder !== "";
  if (measurePlaceholder) el.value = el.placeholder;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
  if (measurePlaceholder) el.value = "";
}

export function AutoGrowTextarea({
  id,
  name,
  placeholder,
  required,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onChange,
}: {
  id?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onChange?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Size on mount and whenever the width changes (rotating a phone, resizing
  // the window), since that's what changes how the text wraps.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastWidth = -1;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      resize(el);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <textarea
      ref={ref}
      id={id}
      name={name}
      placeholder={placeholder}
      required={required}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      rows={1}
      onInput={(e) => {
        resize(e.currentTarget);
        onChange?.();
      }}
      className={clsx("max-h-[60vh] resize-none overflow-y-auto", className)}
    />
  );
}
