import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-md bg-canvas px-3 py-2.5 text-base text-ink shadow-card",
        "placeholder:text-faint",
        "transition-[box-shadow] duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y leading-normal",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
