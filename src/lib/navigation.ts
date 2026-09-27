import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Bookmark,
  Boxes,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Network,
  PlayCircle,
  Repeat2,
  Shapes,
  Sparkles,
} from "lucide-react";

import { FEATURES, type Feature } from "@/lib/auth/access";

/**
 * Application navigation, defined once as data.
 *
 * The sidebar, the command palette and the mobile drawer all read this, so a
 * new section appears everywhere at once and cannot be half-added.
 *
 * This list contains only routes that exist. Sections belonging to later
 * phases (Behavioral, Companies) are added
 * here as they ship - a nav entry that 404s is the same broken promise as a
 * "coming soon" button. The roadmap lives in README.md, not in the UI.
 */

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Feature gate. Omitted means visible to every signed-in user. */
  feature?: Feature;
  /** Short description, used by the command palette. */
  description?: string;
  /** Match child routes for active state. Defaults to true. */
  matchNested?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const primaryNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        matchNested: false,
        description: "Your progress, streak and what to do next",
      },
      {
        title: "Review",
        href: "/review",
        icon: Repeat2,
        description: "Recall what you have learned, before you forget it",
      },
    ],
  },
  {
    label: "Learn",
    items: [
      {
        title: "DSA",
        href: "/learn/dsa",
        icon: GraduationCap,
        description: "Structured data structures and algorithms curriculum",
      },
      {
        title: "Patterns",
        href: "/patterns",
        icon: Shapes,
        feature: FEATURES.PATTERNS,
        description: "Recognise the shape of a problem",
      },
      {
        title: "System Design",
        href: "/learn/system-design",
        icon: Network,
        description: "Scale, latency, replication and the trade-offs between them",
      },
      {
        title: "Low-Level Design",
        href: "/learn/lld",
        icon: Blocks,
        description: "Responsibilities, SOLID, and the patterns worth knowing",
      },
      {
        title: "Visualize",
        href: "/visualize",
        icon: PlayCircle,
        feature: FEATURES.VISUALIZE,
        description: "Step through algorithms frame by frame",
      },
    ],
  },
  {
    label: "Practice",
    items: [
      {
        title: "Design Exercises",
        href: "/system-design",
        icon: Boxes,
        description: "Draw an architecture, submit it, compare against the reference",
      },
      {
        title: "LLD Exercises",
        href: "/lld",
        icon: Blocks,
        description: "Design the classes, defend the trade-offs",
      },
      {
        title: "Problems",
        href: "/problems",
        icon: ListChecks,
        description: "Solve, run tests, track attempts",
      },
      {
        title: "AI Tutor",
        href: "/ai-tutor",
        icon: Sparkles,
        feature: FEATURES.AI_TUTOR,
        description:
          "Work through what you are stuck on, without being handed the answer",
      },
    ],
  },
  {
    label: "Interview",
    items: [
      {
        title: "Preparation",
        href: "/prepare",
        icon: Compass,
        description: "Plans for the shapes interview loops come in",
      },
      {
        title: "Mock Interviews",
        href: "/interviews",
        icon: MessagesSquare,
        feature: FEATURES.AI_MOCK_INTERVIEW,
        description: "Practise an interview, then read feedback with evidence",
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        title: "Bookmarks",
        href: "/dashboard/bookmarks",
        icon: Bookmark,
        description: "Everything you saved",
      },
      {
        title: "Notes",
        href: "/dashboard/notes",
        icon: FileText,
        description: "Your notes, searchable",
      },
    ],
  },
];

/** Flat list, for the command palette and active-route resolution. */
export const allNavItems: NavItem[] = primaryNav.flatMap((g) => g.items);

/** Public marketing navigation. */
export const marketingNav = [
  { title: "Learn", href: "/learn/dsa" },
  { title: "Patterns", href: "/patterns" },
  { title: "Problems", href: "/problems" },
  { title: "Features", href: "/features" },
] as const;

/**
 * Whether a nav item should read as active for the current pathname.
 * Prefix match by default; `matchNested: false` pins it to an exact match so
 * a parent does not light up for a child that has its own entry.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  if (item.matchNested === false) return false;
  return pathname.startsWith(`${item.href}/`);
}
