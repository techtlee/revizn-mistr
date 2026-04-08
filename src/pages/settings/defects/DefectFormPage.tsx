import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useMatch } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCommonDefectsQuery, useUpsertCommonDefect } from "@/hooks/useLibrary";

export default function DefectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = useMatch({ path: "/settings/zavady/novy", end: true }) !== null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: rows = [], isPending } = useCommonDefectsQuery();
  const upsert = useUpsertCommonDefect();
  const [row, setRow] = useState<{ recordId?: string; label_cs: string } | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (isNew) {
      setRow({ label_cs: "" });
      return;
    }
    if (id) {
      const found = rows.find(d => d.id === id);
      if (found) setRow({ recordId: found.id, label_cs: found.label_cs });
      else setRow(null);
    }
  }, [rows, id, isNew, isPending]);

  const save = () => {
    if (!row) return;
    const label_cs = row.label_cs.trim();
    if (!label_cs) {
      toast({ title: "Chybí text", description: "Vyplňte popis závady.", variant: "destructive" });
      return;
    }
    upsert.mutate(
      { id: isNew ? undefined : row.recordId, label_cs },
      {
        onSuccess: () => {
          toast({ title: "Uloženo", description: isNew ? "Závada přidána." : "Změny uloženy." });
          navigate("/settings/zavady");
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

  if (!isNew && id && !rows.some(d => d.id === id)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Záznam nenalezen</CardTitle>
          <CardDescription>
            <Button variant="link" className="px-0 h-auto" asChild>
              <Link to="/settings/zavady">Zpět na seznam</Link>
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
        <Link to="/settings/zavady">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na seznam
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Nová častá závada" : "Upravit závadu"}</CardTitle>
          <CardDescription>Text uvidí všichni uživatelé.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div>
            <Label>Popis (česky)</Label>
            <Input
              className="mt-1"
              value={row.label_cs}
              onChange={e => setRow({ ...row, label_cs: e.target.value })}
              autoFocus
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
