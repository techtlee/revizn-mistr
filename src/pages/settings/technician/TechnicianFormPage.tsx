import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useMatch } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SignatureField from "@/components/SignatureField";
import {
  useTechnicianProfilesQuery,
  useUpsertTechnicianProfile,
} from "@/hooks/useTechnicianProfiles";

interface FormState {
  id?: string;
  name: string;
  address: string;
  certificate_number: string;
  authorization_number: string;
  signature_data: string;
  stamp_url: string;
  phone: string;
  email: string;
  is_default: boolean;
}

const emptyForm: FormState = {
  name: "",
  address: "",
  certificate_number: "",
  authorization_number: "",
  signature_data: "",
  stamp_url: "",
  phone: "",
  email: "",
  is_default: false,
};

export default function TechnicianFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = useMatch({ path: "/library/technik/novy", end: true }) !== null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profiles = [], isPending } = useTechnicianProfilesQuery();
  const upsert = useUpsertTechnicianProfile();
  const [form, setForm] = useState<FormState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPending) return;
    if (isNew) {
      setForm({ ...emptyForm, is_default: profiles.length === 0 });
      return;
    }
    if (id) {
      const found = profiles.find((p) => p.id === id);
      if (found) {
        setForm({
          id: found.id,
          name: found.name ?? "",
          address: found.address ?? "",
          certificate_number: found.certificate_number ?? "",
          authorization_number: found.authorization_number ?? "",
          signature_data: found.signature_data ?? "",
          stamp_url: found.stamp_url ?? "",
          phone: found.phone ?? "",
          email: found.email ?? "",
          is_default: found.is_default,
        });
      }
    }
  }, [profiles, id, isNew, isPending]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: val } : f));

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `razitko/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("report-assets").upload(path, file);
    if (error) {
      toast({ title: "Chyba", description: "Nepodařilo se nahrát razítko.", variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("report-assets").getPublicUrl(path);
    set("stamp_url", data.publicUrl);
  };

  const save = () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast({ title: "Chybí jméno", description: "Vyplňte jméno revizního technika.", variant: "destructive" });
      return;
    }
    upsert.mutate(
      {
        id: form.id,
        name: form.name.trim(),
        address: form.address.trim() || null,
        certificate_number: form.certificate_number.trim() || null,
        authorization_number: form.authorization_number.trim() || null,
        signature_data: form.signature_data || null,
        stamp_url: form.stamp_url || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        is_default: form.is_default,
      },
      {
        onSuccess: () => {
          toast({
            title: "Uloženo",
            description: isNew ? "Profil technika byl vytvořen." : "Změny byly uloženy.",
          });
          navigate("/library/technik");
        },
        onError: () =>
          toast({ title: "Chyba ukládání", description: "Nepodařilo se uložit profil.", variant: "destructive" }),
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

  if (!isNew && id && !profiles.some((p) => p.id === id)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profil nenalezen</CardTitle>
          <CardDescription>
            <Button variant="link" className="px-0 h-auto" asChild>
              <Link to="/library/technik">Zpět na seznam</Link>
            </Button>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (form === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to="/library/technik">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na seznam
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Nový profil technika" : "Upravit profil"}</CardTitle>
          <CardDescription>
            Údaje se automaticky předvyplní do každé nové revizní zprávy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 max-w-lg">
          <div>
            <Label>Jméno revizního technika</Label>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label>Adresa</Label>
            <Input
              className="mt-1"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Ev. č. osvědčení</Label>
              <Input
                className="mt-1"
                value={form.certificate_number}
                onChange={(e) => set("certificate_number", e.target.value)}
              />
            </div>
            <div>
              <Label>Ev. č. oprávnění</Label>
              <Input
                className="mt-1"
                value={form.authorization_number}
                onChange={(e) => set("authorization_number", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Telefon</Label>
              <Input
                className="mt-1"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                className="mt-1"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          <SignatureField
            label="Podpis"
            value={form.signature_data}
            onChange={(v) => set("signature_data", v)}
          />

          <div>
            <Label className="text-sm font-medium">Razítko</Label>
            <div className="mt-1 flex items-center gap-4">
              {form.stamp_url && (
                <img
                  src={form.stamp_url}
                  alt="Razítko"
                  className="h-16 object-contain border rounded"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.stamp_url ? "Změnit razítko" : "Nahrát razítko"}
              </Button>
              {form.stamp_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => set("stamp_url", "")}
                >
                  Odstranit
                </Button>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStampUpload}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={form.is_default}
              onCheckedChange={(v) => set("is_default", v)}
            />
            <Label>Výchozí profil (předvyplní se do nových zpráv)</Label>
          </div>

          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Uložit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
