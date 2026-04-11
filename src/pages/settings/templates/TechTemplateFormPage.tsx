import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useMatch } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTechTemplatesQuery, useUpsertTechTemplate } from "@/hooks/useLibrary";

export default function TechTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = useMatch({ path: "/library/sablony-popisu/novy", end: true }) !== null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: rows = [], isPending } = useTechTemplatesQuery();
  const upsert = useUpsertTechTemplate();
  const [row, setRow] = useState<{ recordId?: string; name: string; body: string } | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (isNew) {
      setRow({ name: "", body: "" });
      return;
    }
    if (id) {
      const found = rows.find(t => t.id === id);
      if (found) setRow({ recordId: found.id, name: found.name, body: found.body });
      else setRow(null);
    }
  }, [rows, id, isNew, isPending]);

  const save = () => {
    if (!row) return;
    const name = row.name.trim();
    if (!name) {
      toast({ title: "Chybí název", description: "Vyplňte název šablony.", variant: "destructive" });
      return;
    }
    upsert.mutate(
      { id: isNew ? undefined : row.recordId, name, body: row.body },
      {
        onSuccess: () => {
          toast({ title: "Uloženo", description: isNew ? "Šablona přidána." : "Změny uloženy." });
          navigate("/library/sablony-popisu");
        },
        onError: () => toast({ title: "Chyba ukládání", variant: "destructive" }),
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

  if (!isNew && id && !rows.some(t => t.id === id)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Záznam nenalezen</CardTitle>
          <CardDescription>
            <Button variant="link" className="px-0 h-auto" asChild>
              <Link to="/library/sablony-popisu">Zpět na seznam</Link>
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
        <Link to="/library/sablony-popisu">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na seznam
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Nová šablona popisu" : "Upravit šablonu"}</CardTitle>
          <CardDescription>Šablonu uvidí všichni; upravit může autor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-3xl">
          <div>
            <Label>Název šablony</Label>
            <Input
              className="mt-1"
              value={row.name}
              onChange={e => setRow({ ...row, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <Label>Text</Label>
            <Textarea
              className="mt-1 min-h-[200px]"
              value={row.body}
              onChange={e => setRow({ ...row, body: e.target.value })}
            />
          </div>
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Uložit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
