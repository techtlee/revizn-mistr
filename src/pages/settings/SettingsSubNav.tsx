import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/library", label: "Přehled", end: true },
  { to: "/library/technik", label: "Profil technika" },
  { to: "/library/firmy", label: "Montážní firmy" },
  { to: "/library/pristroje", label: "Přístroje" },
  { to: "/library/sablony-popisu", label: "Šablony popisu" },
  { to: "/library/zavady", label: "Časté závady" },
  { to: "/library/vychozi-hodnoty", label: "Výchozí hodnoty" },
] as const;

export default function SettingsSubNav() {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-3 mb-8">
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
