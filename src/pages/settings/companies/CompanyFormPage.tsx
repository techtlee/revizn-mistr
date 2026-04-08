import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useMatch } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSavedCompaniesQuery, useUpsertCompany } from "@/hooks/useLibrary";

export default function CompanyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = useMatch({ path: "/settings/firmy/novy", end: true }) !== null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: companies = [], isPending } = useSavedCompaniesQuery();
  const upsertCompany = useUpsertCompany();
  const [row, setRow] = useState<{ id?: string; nazev: string; ico: string; ev_opravneni: string } | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (isNew) {
      setRow({ nazev: "", ico: "", ev_opravneni: "" });
      return;
    }
    if (id) {
      const found = companies.find(c => c.id === id);
      setRow(found ? { id: found.id, nazev: found.nazev, ico: found.ico, ev_opravneni: found.ev_opravneni } : null);
    }
  }, [companies, id, isNew, isPending]);

  const save = () => {
    if (!row) return;
    const nazev = row.nazev.trim();
    if (!nazev) {
      toast({ title: "Chybí název", description: "Vyplňte název firmy.", variant: "destructive" });
      return;
    }
    upsertCompany.mutate(
      { id: row.id, nazev, ico: row.ico.trim(), ev_opravneni: row.ev_opravneni.trim() },
      {
        onSuccess: () => {
          toast({ title: "Uloženo", description: isNew ? "Firma byla přidána do knihovny." : "Změny byly uloženy." });
          navigate("/settings/firmy");
        },
        onError: () =>
          toast({
            title: "Chyba ukládání",
            description: "Upravit můžete jen vlastní záznam.",
            variant: "destructive",
          }),
      },
    );
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && id && !companies.some(c => c.id === id)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Záznam nenalezen</CardTitle>
          <CardDescription>
            <Button variant="link" className="px-0 h-auto" asChild>
              <Link to="/settings/firmy">Zpět na seznam</Link>
            </Button>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (row === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to="/settings/firmy">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na seznam
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Nová montážní firma" : "Upravit firmu"}</CardTitle>
          <CardDescription>Záznam uvidí všichni uživatelé; u seznamu je uveden autor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div>
            <Label>Název</Label>
            <Input
              className="mt-1"
              value={row.nazev}
              onChange={e => setRow({ ...row, nazev: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <Label>IČ</Label>
            <Input className="mt-1" value={row.ico} onChange={e => setRow({ ...row, ico: e.target.value })} />
          </div>
          <div>
            <Label>Ev. č. oprávnění</Label>
            <Input
              className="mt-1"
              value={row.ev_opravneni}
              onChange={e => setRow({ ...row, ev_opravneni: e.target.value })}
            />
          </div>
          <Button onClick={save} disabled={upsertCompany.isPending}>
            {upsertCompany.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Uložit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
