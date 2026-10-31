import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Bookmark,
  Building2,
  Boxes,
  Compass,
  FileText,
  GraduationCap,
  Highlighter,
  Library,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Network,
  PlayCircle,
  Repeat2,
  Route,
  Shapes,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { canAccess, FEATURES, type Feature } from "@/lib/auth/access";

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
  /** Part of the college offering: shown only to Campus members. */
  campusOnly?: boolean;
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
    // Individual learning: concepts, patterns and problems in one section.
    label: "Learn",
    items: [
      {
        title: "All courses",
        href: "/learn",
        icon: Library,
        description: "Search every course and chapter, with your progress",
        matchNested: false,
      },
      {
        title: "DSA",
        href: "/learn/dsa",
        icon: GraduationCap,
        description: "Structured data structures and algorithms curriculum",
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
        title: "Patterns",
        href: "/patterns",
        icon: Shapes,
        feature: FEATURES.PATTERNS,
        description: "Recognise the shape of a problem",
      },
      {
        title: "Problems",
        href: "/problems",
        icon: ListChecks,
        description: "Solve, run tests, track attempts",
      },
      {
        title: "Visualize",
        href: "/visualize",
        icon: PlayCircle,
        feature: FEATURES.VISUALIZE,
        description: "Step through algorithms frame by frame",
      },
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
    // The college offering. Everyone sees the workspace link (to join or
    // accept an invitation); the rest only for members, who are also the
    // only ones the server lets in (src/lib/campus-access.ts).
    label: "Campus",
    items: [
      {
        title: "Campus",
        href: "/campus",
        icon: Building2,
        description: "Your college: classes, assignments and exams",
      },
      {
        title: "Mock Interviews",
        href: "/interviews",
        icon: MessagesSquare,
        feature: FEATURES.AI_MOCK_INTERVIEW,
        campusOnly: true,
        description: "Practise an interview, then read feedback with evidence",
      },
      {
        title: "Interview Prep",
        href: "/prepare",
        icon: Compass,
        campusOnly: true,
        description: "Plans for the shapes interview loops come in",
      },
      {
        title: "Roadmaps",
        href: "/roadmaps",
        icon: Route,
        campusOnly: true,
        description: "What to learn, in what order, and where to practise it",
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
      {
        title: "Highlights",
        href: "/dashboard/highlights",
        icon: Highlighter,
        description: "Everything you marked while reading",
      },
    ],
  },
  {
    label: "Staff",
    items: [
      {
        title: "Admin",
        href: "/admin",
        icon: ShieldCheck,
        // The only nav item behind a role. `canAccess` returns false for
        // every non-admin, so the group renders empty and disappears
        // rather than showing something that 403s.
        feature: FEATURES.ADMIN,
        description: "Users, content, AI usage and the audit log",
      },
    ],
  },
];

/**
 * The groups a given viewer should see: staff items only for admins, Campus
 * items only for members of a college (and admins). This only hides links;
 * admin pages call `requireAdmin` and Campus pages `requireCampusUser`.
 */
export type NavViewer = { role: "USER" | "ADMIN"; campusMember?: boolean } | null;

export function navForViewer(viewer: NavViewer): NavGroup[] {
  const campus = viewer?.role === "ADMIN" || Boolean(viewer?.campusMember);
  return primaryNav
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (item.feature !== FEATURES.ADMIN || canAccess(viewer, item.feature)) &&
          (!item.campusOnly || campus)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/** Flat list, for the command palette and active-route resolution. */
export const allNavItems: NavItem[] = primaryNav.flatMap((g) => g.items);

/** Public marketing navigation. */
/** Campus needs a college account, so a visitor gets the explanation instead. */
export const marketingNav = [
  { title: "Learn", href: "/learn" },
  { title: "Patterns", href: "/patterns" },
  { title: "Problems", href: "/problems" },
  { title: "Campus", href: "/#campus" },
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
