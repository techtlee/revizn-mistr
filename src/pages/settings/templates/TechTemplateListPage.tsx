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
import { useTechTemplatesQuery, useDeleteTechTemplate } from "@/hooks/useLibrary";

export default function TechTemplateListPage() {
  const { toast } = useToast();
  const { data: rows = [], isPending, isError } = useTechTemplatesQuery();
  const del = useDeleteTechTemplate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const remove = async (id: string, name: string) => {
    if (!await confirm({ title: "Odstranit šablonu", description: `Opravdu chcete odstranit šablonu „${name || "bez názvu"}“?`, confirmLabel: "Odstranit", variant: "destructive" })) return;
    del.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno", description: "Šablona byla odebrána." }),
      onError: () => toast({ title: "Chyba", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Šablony technického popisu</h2>
          <p className="text-sm text-muted-foreground">Společné texty pro všechny uživatele.</p>
        </div>
        <Button asChild>
          <Link to="/library/sablony-popisu/novy">
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
                  <TableHead>Název</TableHead>
                  <TableHead className="hidden md:table-cell">Náhled</TableHead>
                  <TableHead className="hidden lg:table-cell">Vytvořil</TableHead>
                  <TableHead className="w-[100px] text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-md truncate text-muted-foreground text-sm">
                      {t.body.replace(/\s+/g, " ").slice(0, 80)}
                      {t.body.length > 80 ? "…" : ""}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {t.creator_display || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Upravit">
                        <Link to={`/library/sablony-popisu/${t.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Smazat"
                        onClick={() => remove(t.id, t.name)}
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
