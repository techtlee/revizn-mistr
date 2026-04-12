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
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useSavedInstrumentsQuery, useDeleteInstrumentTemplate } from "@/hooks/useLibrary";

export default function InstrumentListPage() {
  const { toast } = useToast();
  const { data: rows = [], isPending, isError } = useSavedInstrumentsQuery();
  const del = useDeleteInstrumentTemplate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const remove = async (id: string, label: string) => {
    if (!await confirm({ title: "Odstranit šablonu", description: `Opravdu chcete odstranit šablonu „${label || "bez názvu"}“?`, confirmLabel: "Odstranit", variant: "destructive" })) return;
    del.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno", description: "Šablona byla odebrána." }),
      onError: () => toast({ title: "Chyba", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Šablony měřicích přístrojů</h2>
          <p className="text-sm text-muted-foreground">Společná knihovna pro všechny uživatele.</p>
        </div>
        <Button asChild>
          <Link to="/library/pristroje/novy">
            <Plus className="w-4 h-4 mr-2" />
            Nová šablona
          </Link>
        </Button>
      </div>

      {isError && <p className="text-sm text-destructive">Nepodařilo se načíst data.</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Seznam</CardTitle>
          <CardDescription>
            {isPending ? "Načítání…" : rows.length === 0 ? "Zatím žádné šablony." : null}
          </CardDescription>
        </CardHeader>
        {!isPending && rows.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Název přístroje</TableHead>
                  <TableHead className="hidden sm:table-cell">Typ</TableHead>
                  <TableHead className="hidden md:table-cell">Vytvořil</TableHead>
                  <TableHead className="w-[100px] text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nazev_pristroje || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {r.typ_pristroje || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {r.creator_display || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Upravit">
                        <Link to={`/library/pristroje/${r.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Smazat"
                        onClick={() => remove(r.id, r.nazev_pristroje ?? "")}
                        disabled={del.isPending}
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
      <ConfirmDialog />
    </div>
  );
}
