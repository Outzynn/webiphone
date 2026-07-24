import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export function LinkButton({
  href,
  className,
  variant,
  size,
  children,
}: {
  href: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants> &
  Pick<React.ComponentProps<"a">, "className">) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
