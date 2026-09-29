import Link from "next/link";
import {
  IconCompliance,
  IconConnections,
  IconNutrition,
  IconPlan,
  IconSeason,
  IconSignOut,
  IconStrength,
} from "./icons";

export type NavKey =
  | "plan"
  | "season"
  | "nutrition"
  | "strength"
  | "compliance"
  | "connections";

const NAV_ITEMS: {
  key: NavKey;
  href: string;
  label: string;
  tabLabel: string;
  icon: () => React.ReactNode;
}[] = [
  { key: "plan", href: "/plan", label: "Today's plan", tabLabel: "Today", icon: IconPlan },
  { key: "season", href: "/season", label: "Season plan", tabLabel: "Season", icon: IconSeason },
  {
    key: "nutrition",
    href: "/nutrition",
    label: "Nutrition log",
    tabLabel: "Fuel",
    icon: IconNutrition,
  },
  {
    key: "strength",
    href: "/strength",
    label: "Strength log",
    tabLabel: "Strength",
    icon: IconStrength,
  },
  {
    key: "compliance",
    href: "/compliance",
    label: "Compliance",
    tabLabel: "Trends",
    icon: IconCompliance,
  },
  {
    key: "connections",
    href: "/connections",
    label: "Connections",
    tabLabel: "Connect",
    icon: IconConnections,
  },
];

interface AppShellProps {
  active: NavKey;
  athleteEmail: string;
  athleteSub?: string;
  brandSub?: string;
  onSignOut: () => void;
  children: React.ReactNode;
}

function initialsFromEmail(email: string): string {
  const name = email.split("@")[0] ?? email;
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function AppShell({
  active,
  athleteEmail,
  athleteSub,
  brandSub,
  onSignOut,
  children,
}: AppShellProps) {
  return (
    <div className="nav:flex min-h-screen">
      <aside className="hidden nav:flex nav:sticky nav:top-0 nav:h-screen nav:w-[248px] nav:shrink-0 flex-col gap-7 bg-[var(--brand-dark)] p-[28px_18px]">
        <div className="flex items-center gap-[10px] px-1.5">
          <div className="brand-mark">CP</div>
          <div className="flex flex-col">
            <span className="brand-name">Cycling Plan Coach</span>
            {brandSub && <span className="brand-sub">{brandSub}</span>}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`nav-item${item.key === active ? " active" : ""}`}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-[10px] border-t border-white/[0.14] pt-4">
          <div className="avatar">{initialsFromEmail(athleteEmail)}</div>
          <div className="flex min-w-0 flex-col">
            <span className="sidebar-foot-name truncate">{athleteEmail}</span>
            {athleteSub && <span className="sidebar-foot-sub truncate">{athleteSub}</span>}
          </div>
          <button
            onClick={onSignOut}
            className="ml-auto text-white/50 hover:text-white"
            title="Sign out"
          >
            <IconSignOut />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 pb-24 nav:px-10 nav:py-8 nav:pb-8">
        {children}
      </main>

      <nav className="card fixed inset-x-0 bottom-0 z-10 flex rounded-none border-x-0 border-b-0 p-[9px_6px_14px] nav:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`tab${item.key === active ? " active" : ""}`}
          >
            <item.icon />
            {item.tabLabel}
          </Link>
        ))}
      </nav>
    </div>
  );
}
