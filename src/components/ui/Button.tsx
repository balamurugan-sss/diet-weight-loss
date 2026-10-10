import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "lime" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-forest text-on-accent hover:bg-forest-600 font-bold",
  secondary: "bg-forest-50 text-forest hover:bg-forest-100",
  ghost: "text-forest hover:bg-forest-50",
  lime: "bg-lime text-forest-700 hover:bg-lime-600 font-bold",
  danger: "bg-terracotta text-white hover:opacity-90",
  outline: "border border-line bg-surface text-charcoal hover:border-forest/50",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-xl gap-2",
  lg: "h-13 px-6 text-base rounded-xl gap-2",
  xl: "h-15 px-7 text-[17px] rounded-2xl gap-3",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant,
  size,
  className,
  children,
  href,
  ...rest
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
