import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Public educational pages are indexable; anything behind auth is not.
 * The same list is enforced with an X-Robots-Tag header in next.config.ts,
 * because robots.txt is a request, not a control.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/profile",
          "/admin",
          "/admin/",
          "/review",
          "/interview",
          "/ai-tutor",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
