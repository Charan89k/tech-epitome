import { LogoMark } from "@/components/brand/logo";

/**
 * Root-level fallback. Route segments define their own skeletons where the
 * layout is known; this covers the first paint of a cold navigation.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <LogoMark
        gradient
        idSuffix="loading"
        className="size-7 animate-pulse opacity-70"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
