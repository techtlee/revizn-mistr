import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useTechnicianProfilesQuery, useDeleteTechnicianProfile } from "@/hooks/useTechnicianProfiles";

export default function TechnicianListPage() {
  const { toast } = useToast();
  const { data: profiles = [], isPending, isError } = useTechnicianProfilesQuery();
  const deleteProfile = useDeleteTechnicianProfile();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const remove = async (id: string, name: string) => {
    if (
      !(await confirm({
        title: "Odstranit profil",
        description: `Opravdu chcete odstranit profil „${name || "bez jména"}"?`,
        confirmLabel: "Odstranit",
        variant: "destructive",
      }))
    )
      return;
    deleteProfile.mutate(id, {
      onSuccess: () =>
        toast({ title: "Smazáno", description: "Profil technika byl odstraněn." }),
      onError: () =>
        toast({
          title: "Chyba",
          description: "Nepodařilo se smazat profil.",
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profil revizního technika</h2>
          <p className="text-sm text-muted-foreground">
            Spravujte své údaje. Výchozí profil se automaticky předvyplní do každé nové zprávy.
          </p>
        </div>
        <Button asChild>
          <Link to="/library/technik/novy">
            <Plus className="w-4 h-4 mr-2" />
            Nový profil
          </Link>
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Nepodařilo se načíst profily. Zkontrolujte migraci databáze.
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profily</CardTitle>
          <CardDescription>
            {isPending
              ? "Načítání…"
              : profiles.length === 0
                ? "Zatím žádné profily — vytvořte svůj první."
                : null}
          </CardDescription>
        </CardHeader>
        {!isPending && profiles.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jméno</TableHead>
                  <TableHead className="hidden sm:table-cell">Ev. č. osvědčení</TableHead>
                  <TableHead className="hidden md:table-cell">Telefon</TableHead>
                  <TableHead className="w-[120px] text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {p.name || "—"}
                        {p.is_default && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Star className="w-3 h-3" />
                            Výchozí
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {p.certificate_number || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {p.phone || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Upravit">
                        <Link to={`/library/technik/${p.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Smazat"
                        onClick={() => remove(p.id, p.name ?? "")}
                        disabled={deleteProfile.isPending}
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
