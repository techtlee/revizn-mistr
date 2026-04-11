import { Outlet } from "react-router-dom";
import SettingsSubNav from "./SettingsSubNav";

export default function SettingsLayout() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Knihovna šablon a údajů</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Společná knihovna pro všechny uživatele (u vytvořených záznamů je uveden autor). Výchozí hodnoty revize jsou
        jen u vás.
      </p>
      <SettingsSubNav />
      <Outlet />
    </div>
  );
}
