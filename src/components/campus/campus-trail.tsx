import { Fragment } from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { route } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/**
 * Where a Campus page sits: Campus › institution › class › page. Rendered as
 * the PageHeader eyebrow on every institution page, so the way back is
 * always in the same place instead of a lone button on the right.
 */
export function CampusTrail({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Campus", href: "/campus" }, ...items];
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((crumb, i) => (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.href && i < trail.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link href={route(crumb.href)}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
