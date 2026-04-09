import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "group/sbtn relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-control border border-transparent font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      circle: {
        false: "",
        true: "aspect-square px-0",
      },
      outlined: {
        false: "",
        true: "bg-transparent shadow-none",
      },
      plain: {
        false: "",
        true: "shadow-none",
      },
      round: {
        false: "",
        true: "rounded-full",
      },
      size: {
        default: "h-10 px-4 text-sm",
        icon: "h-10 w-10 px-0 text-sm",
        large: "h-11 px-5 text-base",
        lg: "h-11 px-5 text-base",
        small: "h-8 px-3 text-xs",
        sm: "h-8 px-3 text-xs",
      },
      variant: {
        default: "border-border bg-background text-foreground shadow-sm hover:border-primary/35 hover:text-primary focus-visible:ring-ring/20",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92 focus-visible:ring-destructive/25",
        ghost: "bg-transparent text-foreground hover:bg-secondary/70 hover:text-foreground focus-visible:ring-ring/20",
        info: "bg-slate-600 text-white shadow-sm hover:bg-slate-700 focus-visible:ring-slate-500/25 dark:bg-slate-500 dark:hover:bg-slate-400",
        link: "h-auto border-none px-0 text-primary underline-offset-4 hover:underline focus-visible:ring-transparent",
        outline: "border-border bg-background text-foreground shadow-sm hover:border-primary/35 hover:text-primary focus-visible:ring-ring/20",
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92 focus-visible:ring-primary/25",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85 focus-visible:ring-ring/20",
        success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/25 dark:bg-emerald-500 dark:hover:bg-emerald-400",
        text: "h-auto border-none bg-transparent px-0 text-primary shadow-none hover:bg-primary/8 focus-visible:ring-primary/10",
        warning: "bg-amber-500 text-amber-950 shadow-sm hover:bg-amber-400 focus-visible:ring-amber-500/25 dark:text-amber-950",
        danger: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92 focus-visible:ring-destructive/25",
      },
    },
    compoundVariants: [
      { circle: true, size: "default", className: "w-10" },
      { circle: true, size: "large", className: "w-11" },
      { circle: true, size: "lg", className: "w-11" },
      { circle: true, size: "small", className: "w-8" },
      { circle: true, size: "sm", className: "w-8" },
      { outlined: true, variant: "primary", className: "!bg-transparent border-primary/45 text-primary hover:!bg-primary/8" },
      { outlined: true, variant: "info", className: "!bg-transparent border-slate-400/55 text-slate-700 hover:!bg-slate-500/8 dark:text-slate-200" },
      { outlined: true, variant: "success", className: "!bg-transparent border-emerald-500/45 text-emerald-700 hover:!bg-emerald-500/8 dark:text-emerald-300" },
      { outlined: true, variant: "warning", className: "!bg-transparent border-amber-500/55 text-amber-700 hover:!bg-amber-500/10 dark:text-amber-300" },
      { outlined: true, variant: "danger", className: "!bg-transparent border-destructive/45 text-destructive hover:!bg-destructive/8" },
      { outlined: true, variant: "destructive", className: "!bg-transparent border-destructive/45 text-destructive hover:!bg-destructive/8" },
      { plain: true, variant: "default", className: "border-border bg-secondary/55 text-foreground hover:bg-secondary/75" },
      { plain: true, variant: "primary", className: "border-primary/18 bg-primary/10 text-primary hover:bg-primary/14" },
      { plain: true, variant: "info", className: "border-slate-400/18 bg-slate-500/10 text-slate-700 hover:bg-slate-500/14 dark:text-slate-200" },
      { plain: true, variant: "success", className: "border-emerald-500/18 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/14 dark:text-emerald-300" },
      { plain: true, variant: "warning", className: "border-amber-500/18 bg-amber-500/12 text-amber-700 hover:bg-amber-500/16 dark:text-amber-300" },
      { plain: true, variant: "danger", className: "border-destructive/18 bg-destructive/10 text-destructive hover:bg-destructive/14" },
      { plain: true, variant: "destructive", className: "border-destructive/18 bg-destructive/10 text-destructive hover:bg-destructive/14" },
    ],
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, circle = false, className, outlined = false, plain = false, round = false, size, variant = "primary", children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ circle, className, outlined, plain, round, size, variant }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    const isSolidVariant =
      !plain &&
      !outlined &&
      !["default", "ghost", "link", "outline", "text"].includes(variant || "primary");
    const sweepId = useId() + "-sweep";

    return (
      <button className={cn(buttonVariants({ circle, className, outlined, plain, round, size, variant }))} ref={ref} {...props}>
        {isSolidVariant ? (
          <span className="pointer-events-none absolute inset-0 z-0 overflow-hidden motion-reduce:hidden">
            <span className="absolute inset-y-0 -left-1/2 z-0 block w-1/2 -skew-x-12 -translate-x-full opacity-0 transition-all duration-[800ms] ease-in-out group-hover/sbtn:translate-x-[400%] group-hover/sbtn:opacity-[0.35]">
              <svg className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={sweepId} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                    <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect fill={`url(#${sweepId})`} height="100%" width="100%" />
              </svg>
            </span>
          </span>
        ) : null}
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </button>
    );
  },
);
Button.displayName = "Button";

export function AsyncActionButton({
  children,
  loading,
  loadingLabel = "处理中...",
  ...props
}: ButtonProps & {
  loading?: boolean;
  loadingLabel?: ReactNode;
}) {
  return (
    <Button disabled={props.disabled || loading} {...props}>
      {loading ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
