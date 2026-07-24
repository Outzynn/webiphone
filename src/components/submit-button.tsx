"use client";

import { useFormStatus } from "react-dom";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export function SubmitButton({
  children,
  pendingText,
  ...props
}: {
  children: React.ReactNode;
  pendingText?: string;
} & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingText ?? "Guardando...") : children}
    </Button>
  );
}
