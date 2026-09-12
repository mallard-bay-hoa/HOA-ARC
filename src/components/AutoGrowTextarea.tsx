"use client";

import { useRef } from "react";
import { clsx } from "clsx";

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function AutoGrowTextarea({
  id,
  name,
  placeholder,
  required,
  className,
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  "aria-describedby"?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <textarea
      ref={ref}
      id={id}
      name={name}
      placeholder={placeholder}
      required={required}
      aria-describedby={ariaDescribedBy}
      rows={1}
      onInput={(e) => resize(e.currentTarget)}
      className={clsx("max-h-[60vh] resize-none overflow-y-auto", className)}
    />
  );
}
