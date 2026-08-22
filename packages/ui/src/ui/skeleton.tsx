import type { ComponentProps } from "react";
import { cn } from "../utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("skeleton", className)} {...props} />;
}

export { Skeleton };
