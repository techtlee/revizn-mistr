import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headset, Mail, Phone, Clock, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Support() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Podpora</h1>
        <p className="text-muted-foreground mt-1">
          Potřebujete pomoc? Kontaktujte nás některým z níže uvedených způsobů.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="w-5 h-5 text-primary" />
              Telefon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="tel:+420602762925"
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              +420 602 762 925
            </a>
            <p className="text-sm text-muted-foreground mt-1">
              Volejte v pracovní dny 8:00–17:00
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-5 h-5 text-primary" />
              E-mail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:it@techtlee.com?subject=Revizní mistr – podpora"
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              it@techtlee.com
            </a>
            <p className="text-sm text-muted-foreground mt-1">
              Odpovídáme zpravidla do 24 hodin
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-primary" />
              Provozní doba podpory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pondělí – Pátek</span>
              <span className="font-medium">8:00 – 17:00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sobota – Neděle</span>
              <span className="font-medium text-muted-foreground">Zavřeno</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Mimo provozní dobu nás kontaktujte e-mailem.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-5 h-5 text-primary" />
              Často kladené dotazy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Jak exportuji revizní zprávu do PDF?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Otevřete detail zprávy a klikněte na tlačítko „Stáhnout PDF" v horní části stránky.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Mohu obnovit smazanou zprávu?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Smazané zprávy nelze obnovit. Doporučujeme před smazáním exportovat PDF kopii.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Jak přidám nového klienta?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                V sekci Klienti klikněte na „Nový klient" a vyplňte potřebné údaje.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Headset className="w-6 h-6 text-primary" />
            <div>
              <p className="font-medium">Potřebujete něco jiného?</p>
              <p className="text-sm text-muted-foreground">Napište nám e-mail s popisem vašeho požadavku.</p>
            </div>
          </div>
          <Button
            onClick={() => window.open("mailto:it@techtlee.com?subject=Revizní mistr – podpora", "_blank")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Napsat e-mail
            <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-60" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
