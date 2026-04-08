import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSavedCompaniesQuery, useDeleteCompany } from "@/hooks/useLibrary";

export default function CompanyListPage() {
  const { toast } = useToast();
  const { data: companies = [], isPending, isError } = useSavedCompaniesQuery();
  const deleteCompany = useDeleteCompany();

  const remove = (id: string, nazev: string) => {
    if (!confirm(`Odstranit firmu „${nazev || "bez názvu"}“?`)) return;
    deleteCompany.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno", description: "Firma byla odebrána z knihovny." }),
      onError: () => toast({ title: "Chyba", description: "Nepodařilo se smazat (jen vlastní záznamy).", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Montážní firmy</h2>
          <p className="text-sm text-muted-foreground">
            Společný seznam — výběr v revizi doplní IČ a evidenční číslo oprávnění.
          </p>
        </div>
        <Button asChild>
          <Link to="/settings/firmy/novy">
            <Plus className="w-4 h-4 mr-2" />
            Nová firma
          </Link>
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Nepodařilo se načíst firmy. Zkontrolujte migraci databáze.</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Seznam</CardTitle>
          <CardDescription>
            {isPending ? "Načítání…" : companies.length === 0 ? "Zatím žádné firmy — vytvořte první záznam." : null}
          </CardDescription>
        </CardHeader>
        {!isPending && companies.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Název</TableHead>
                  <TableHead>IČ</TableHead>
                  <TableHead className="hidden sm:table-cell">Ev. č. oprávnění</TableHead>
                  <TableHead className="hidden md:table-cell">Vytvořil</TableHead>
                  <TableHead className="w-[100px] text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nazev || "—"}</TableCell>
                    <TableCell>{c.ico || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {c.ev_opravneni || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {c.creator_display || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Upravit">
                        <Link to={`/settings/firmy/${c.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Smazat"
                        onClick={() => remove(c.id, c.nazev)}
                        disabled={deleteCompany.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
