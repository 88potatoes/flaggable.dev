"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "../utils";

const buttonVariants = cva(
  "btn group/button shrink-0 border-transparent bg-clip-padding whitespace-nowrap active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "btn-neutral",
        accent: "btn-primary",
        primary: "btn-primary",
        quiet: "btn-outline btn-primary",
        light: "btn-ghost",
        outline: "btn-outline",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        destructive: "btn-error",
        link: "btn-link",
      },
      size: {
        default: "btn-sm",
        xs: "btn-xs",
        sm: "btn-sm",
        lg: "btn-md",
        icon: "btn-square btn-sm",
        "icon-xs": "btn-square btn-xs",
        "icon-sm": "btn-square btn-sm",
        "icon-lg": "btn-square btn-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
