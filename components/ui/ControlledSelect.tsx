"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  triggerCls?: string;
  dotCls?: string;
}

interface SharedProps {
  options: SelectOption[];
  className?: string;
  variant?: "default" | "pill";
  label?: string;
}

interface WithHandlers extends SharedProps {
  value: string;
  onChange: (value: string) => void;
  control?: never;
  name?: never;
}

interface WithControl<T extends FieldValues> extends SharedProps {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
}

type ControlledSelectProps<T extends FieldValues = FieldValues> =
  | WithHandlers
  | WithControl<T>;

function SelectCore({
  value,
  onChange,
  options,
  className,
  variant = "default",
}: Required<Pick<WithHandlers, "value" | "onChange">> & SharedProps) {
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
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", current.dotCls)} />
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

export function ControlledSelect<T extends FieldValues = FieldValues>(
  props: ControlledSelectProps<T>,
) {
  const { label, options, className, variant } = props;

  const select = props.control ? (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <SelectCore
          value={field.value}
          onChange={field.onChange}
          options={options}
          className={className}
          variant={variant}
        />
      )}
    />
  ) : (
    <SelectCore
      value={props.value}
      onChange={props.onChange}
      options={options}
      className={className}
      variant={variant}
    />
  );

  if (!label) return select;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {select}
    </div>
  );
}
