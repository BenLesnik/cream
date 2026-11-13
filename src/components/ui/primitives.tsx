"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Dialog, Popover, Slider as RSlider, Switch as RSwitch, Tooltip as RTooltip } from "radix-ui";
import { X } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; active?: boolean }
>(function Button({ variant = "secondary", size = "md", active, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      data-active={active || undefined}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-45 select-none",
        {
          primary: "bg-accent text-accent-ink hover:brightness-[1.08] active:brightness-95",
          secondary:
            "bg-surface text-fg border border-line hover:border-line-strong hover:bg-surface-2 data-[active]:border-fg data-[active]:bg-surface-2",
          outline:
            "border border-line-strong text-fg hover:bg-surface-2 data-[active]:bg-fg data-[active]:text-bg data-[active]:border-fg",
          ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg data-[active]:bg-surface-3 data-[active]:text-fg",
          danger: "text-danger hover:bg-surface-2",
        }[variant],
        {
          sm: "h-8 px-2.5 text-[13px]",
          md: "h-9 px-3 text-[13.5px]",
          lg: "h-11 px-4 text-[15px]",
          icon: "h-9 w-9",
          "icon-sm": "h-8 w-8",
        }[size],
        className,
      )}
      {...props}
    />
  );
});

export function Tooltip({ label, children, side = "bottom" }: { label: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RTooltip.Root delayDuration={350}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="z-[100] rounded-md bg-fg px-2 py-1 text-[12px] font-medium text-bg shadow-md animate-fade-in"
        >
          {label}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

export const TooltipProvider = RTooltip.Provider;

export function PopoverPanel({
  trigger,
  children,
  align = "start",
  className,
  open,
  onOpenChange,
  sideOffset = 8,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  sideOffset?: number;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={clsx(
            "z-[60] rounded-xl border border-line bg-surface p-4 text-fg shadow-lg outline-none animate-pop-in",
            className,
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export const PopoverClose = Popover.Close;

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  width = 440,
  footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: "right" | "left";
  width?: number;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/25 animate-fade-in dark:bg-black/50" />
        <Dialog.Content
          style={{ width: `min(${width}px, 100vw)` }}
          className={clsx(
            "fixed top-0 bottom-0 z-[71] flex flex-col bg-surface text-fg shadow-lg outline-none animate-slide-in-right",
            side === "right" ? "right-0 border-l border-line" : "left-0 border-r border-line",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-[15px] font-semibold tracking-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-[13px] text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Panel"}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X size={16} />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  width = 640,
  footer,
  description,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/30 animate-fade-in dark:bg-black/55" />
        <Dialog.Content
          style={{ width: `min(${width}px, calc(100vw - 24px))` }}
          className="fixed left-1/2 top-1/2 z-[71] flex max-h-[min(88vh,900px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-line bg-surface text-fg shadow-lg outline-none animate-pop-in"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
            <div>
              <Dialog.Title className="text-[15px] font-semibold tracking-tight">{title}</Dialog.Title>
              <Dialog.Description className={description ? "text-[13px] text-muted" : "sr-only"}>
                {description ?? (typeof title === "string" ? title : "Dialog")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X size={16} />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer ? <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  label?: string;
}) {
  return (
    <RSwitch.Root
      id={id}
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative h-[20px] w-[34px] shrink-0 cursor-pointer rounded-full bg-surface-3 transition-colors data-[state=checked]:bg-accent"
    >
      <RSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[16px]" />
    </RSwitch.Root>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  size = "md",
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={clsx("inline-flex rounded-lg bg-surface-2 p-0.5 ring-1 ring-inset ring-line", className)}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={clsx(
            "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-all",
            size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-8 px-3 text-[13px]",
            o.value === value ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  onValueCommit,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (v: [number, number]) => void;
  onValueCommit?: (v: [number, number]) => void;
}) {
  return (
    <RSlider.Root
      min={min}
      max={max}
      step={step}
      value={value}
      minStepsBetweenThumbs={1}
      onValueChange={(v) => onValueChange([v[0], v[1]])}
      onValueCommit={(v) => onValueCommit?.([v[0], v[1]])}
      className="relative flex h-5 w-full touch-none select-none items-center"
    >
      <RSlider.Track className="relative h-[3px] grow rounded-full bg-surface-3">
        <RSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RSlider.Track>
      {[0, 1].map((i) => (
        <RSlider.Thumb
          key={i}
          aria-label={i === 0 ? "Minimum" : "Maximum"}
          className="block h-[18px] w-[18px] rounded-full border border-line-strong bg-surface shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent"
        />
      ))}
    </RSlider.Root>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
        active
          ? "border-fg bg-fg text-bg"
          : "border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h4>
      {action}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface-2 px-1 font-mono text-[10.5px] text-muted">
      {children}
    </kbd>
  );
}
