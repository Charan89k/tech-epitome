import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Right-aligned controls: filters, primary action. */
  actions?: React.ReactNode;
  /** Rendered above the title, e.g. a breadcrumb or eyebrow label. */
  eyebrow?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow}
        <h1 className="tracking-headline truncate text-2xl font-bold sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
