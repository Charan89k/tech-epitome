import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A plain <select> styled like <Input>. For server-rendered forms that post
 * with FormData, where the Radix Select (a client component) is overkill.
 */
function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: "default" | "sm" }) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "block cursor-pointer rounded-md border border-input bg-background text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30",
        size === "sm" ? "h-8 px-2 text-xs" : "h-9 px-2.5 text-sm",
        className
      )}
      {...props}
    />
  );
}

export { NativeSelect };
