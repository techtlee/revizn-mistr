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
import { useCommonDefectsQuery, useDeleteCommonDefect } from "@/hooks/useLibrary";

export default function DefectListPage() {
  const { toast } = useToast();
  const { data: rows = [], isPending, isError } = useCommonDefectsQuery();
  const del = useDeleteCommonDefect();

  const remove = (id: string, label: string) => {
    if (!confirm(`Odstranit závadu „${label || "bez textu"}“?`)) return;
    del.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno", description: "Záznam byl odebrán." }),
      onError: () => toast({ title: "Chyba", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Časté závady</h2>
          <p className="text-sm text-muted-foreground">Společná knihovna textů.</p>
        </div>
        <Button asChild>
          <Link to="/settings/zavady/novy">
            <Plus className="w-4 h-4 mr-2" />
            Nová závada
          </Link>
        </Button>
      </div>

      {isError && <p className="text-sm text-destructive">Nepodařilo se načíst data.</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Seznam</CardTitle>
          <CardDescription>
            {isPending ? "Načítání…" : rows.length === 0 ? "Zatím žádné záznamy." : null}
          </CardDescription>
        </CardHeader>
        {!isPending && rows.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Text</TableHead>
                  <TableHead className="hidden md:table-cell">Vytvořil</TableHead>
                  <TableHead className="w-[100px] text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.label_cs || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {d.creator_display || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Upravit">
                        <Link to={`/settings/zavady/${d.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Smazat"
                        onClick={() => remove(d.id, d.label_cs)}
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
    </div>
  );
}
