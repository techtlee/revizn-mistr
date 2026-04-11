import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientsQuery, useDeleteClient } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  objednatel: "Objednatel",
  majitel: "Majitel",
  provozovatel: "Provozovatel",
};

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: clients, isLoading } = useClientsQuery();
  const deleteClient = useDeleteClient();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = clients?.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.ico?.toLowerCase().includes(q) ||
      c.address_city?.toLowerCase().includes(q) ||
      c.contact_person?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string) => {
    if (!confirm("Opravdu chcete smazat tohoto klienta?")) return;
    deleteClient.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno", description: "Klient byl odstraněn." }),
      onError: () => toast({ title: "Chyba", description: "Nepodařilo se smazat klienta.", variant: "destructive" }),
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Klienti</h1>
          <p className="text-muted-foreground mt-1">Správa klientů a objednatelů revizí</p>
        </div>
        <Button onClick={() => navigate("/clients/new")} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nový klient
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Hledat dle jména, IČO, města, kontaktu nebo e-mailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Seznam klientů
            {filtered && <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered?.length ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "Žádní klienti neodpovídají hledání" : "Zatím žádní klienti"}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => navigate("/clients/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Přidat prvního klienta
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jméno / Firma</TableHead>
                  <TableHead className="hidden md:table-cell">IČO</TableHead>
                  <TableHead className="hidden lg:table-cell">Kontakt</TableHead>
                  <TableHead className="hidden sm:table-cell">Město</TableHead>
                  <TableHead className="hidden lg:table-cell">Typ</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <span className="font-semibold">{client.name}</span>
                      {client.contact_person && (
                        <p className="text-sm text-muted-foreground mt-0.5">{client.contact_person}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground font-mono">
                      {client.ico || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {client.phone}
                          </div>
                        )}
                        {!client.email && !client.phone && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {client.address_city ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {client.address_city}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(client.client_type ?? []).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {CLIENT_TYPE_LABELS[t] || t}
                          </Badge>
                        ))}
                        {(!client.client_type || client.client_type.length === 0) && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/clients/${client.id}`)}
                          title="Upravit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(client.id)}
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
