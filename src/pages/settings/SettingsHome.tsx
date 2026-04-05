import { Link } from "react-router-dom";
import { Building2, ClipboardList, FileText, ListTree, SlidersHorizontal } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    to: "/settings/firmy",
    title: "Montážní firmy",
    description: "Uložené firmy s IČ a evidenčním číslem pro rychlé doplnění v revizi.",
    icon: Building2,
  },
  {
    to: "/settings/pristroje",
    title: "Šablony měřicích přístrojů",
    description: "Předvyplnění přístrojů v revizi.",
    icon: ClipboardList,
  },
  {
    to: "/settings/sablony-popisu",
    title: "Šablony technického popisu",
    description: "Textové šablony pro pole technický popis.",
    icon: FileText,
  },
  {
    to: "/settings/zavady",
    title: "Časté závady",
    description: "Předdefinované texty závad pro rychlý výběr.",
    icon: ListTree,
  },
  {
    to: "/settings/vychozi-hodnoty",
    title: "Výchozí hodnoty revize",
    description: "Co se má předvyplnit při vytvoření nové zprávy.",
    icon: SlidersHorizontal,
  },
] as const;

export default function SettingsHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ to, title, description, icon: Icon }) => (
        <Link key={to} to={to} className="block group">
          <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{title}</CardTitle>
                  <CardDescription className="mt-1.5">{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
