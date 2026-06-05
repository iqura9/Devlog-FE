"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  triggerCls?: string;
  dotCls?: string;
}

interface ControlledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  variant?: "default" | "pill";
}

export function ControlledSelect({
  value,
  onChange,
  options,
  className,
  variant = "default",
}: ControlledSelectProps) {
  const current = options.find((o) => o.value === value);
  const isPill = variant === "pill";

  return (
    <Select value={value} onValueChange={onChange}>
      {isPill ? (
        <SelectTrigger
          className={cn(
            "h-6 w-auto gap-1.5 rounded-full border px-2.5 py-0 text-[11px] font-semibold shadow-none",
            current?.triggerCls,
            className,
          )}
        >
          {current?.dotCls ? (
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                current.dotCls,
              )}
            />
          ) : null}
          <span>{current?.label}</span>
        </SelectTrigger>
      ) : (
        <SelectTrigger className={cn("h-7 w-32.5 text-[12px]", className)}>
          <span>{current?.label}</span>
        </SelectTrigger>
      )}
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className={isPill ? "text-[12px]" : undefined}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
