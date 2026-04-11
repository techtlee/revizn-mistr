import { useNavigate } from "react-router-dom";
import { useDraftsQuery, useDeleteDraft } from "@/hooks/useDrafts";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilePenLine, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

const STEP_LABELS = [
  "Hlavička", "Objekt", "Údaje", "SPD", "Předmět",
  "Doklady", "Popis", "Vnější", "Vnitřní", "Měření", "Závěr",
];

const TOTAL_STEPS = STEP_LABELS.length;

function completionPercent(step: number | null): number {
  if (step == null) return 0;
  return Math.round(((step + 1) / TOTAL_STEPS) * 100);
}

export default function Drafts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: drafts, isLoading } = useDraftsQuery();
  const deleteDraft = useDeleteDraft();

  const handleDelete = (id: string) => {
    if (!confirm("Opravdu chcete smazat tento koncept?")) return;
    deleteDraft.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno", description: "Koncept byl odstraněn." }),
      onError: () => toast({ title: "Chyba", description: "Nepodařilo se smazat koncept.", variant: "destructive" }),
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Koncepty</h1>
          <p className="text-muted-foreground mt-1">Rozpracované revizní zprávy</p>
        </div>
        <Button onClick={() => navigate("/report/new")} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nová revize
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FilePenLine className="w-5 h-5" />
            Rozpracované zprávy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !drafts?.length ? (
            <div className="p-12 text-center">
              <FilePenLine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Žádné rozpracované zprávy</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Při vytváření nové revize můžete kdykoliv uložit koncept.
              </p>
              <Button className="mt-4" onClick={() => navigate("/report/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Vytvořit novou zprávu
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ev. č. / Adresa</TableHead>
                  <TableHead className="hidden md:table-cell">Objednatel</TableHead>
                  <TableHead className="hidden sm:table-cell">Krok</TableHead>
                  <TableHead className="hidden lg:table-cell">Postup</TableHead>
                  <TableHead className="hidden md:table-cell">Naposledy upraveno</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => {
                  const addr = formatObjektAdresaOneLine(draft);
                  const pct = completionPercent(draft.draft_step);
                  const stepLabel = draft.draft_step != null ? STEP_LABELS[draft.draft_step] : "—";

                  return (
                    <TableRow key={draft.id}>
                      <TableCell>
                        <div>
                          <span className="font-mono font-semibold text-primary">
                            {draft.ev_cislo_zpravy || "Bez čísla"}
                          </span>
                          {addr && (
                            <p className="text-sm text-muted-foreground mt-0.5">{addr}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {draft.objednatel_revize || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{stepLabel}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {format(new Date(draft.updated_at), "d. M. yyyy HH:mm", { locale: cs })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/report/${draft.id}/edit`)}
                            title="Pokračovat v úpravě"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(draft.id)}
                            title="Smazat koncept"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
