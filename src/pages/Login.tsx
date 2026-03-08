import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Zap, LogIn, Loader2, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Chyba přihlášení", description: "Nesprávný e-mail nebo heslo.", variant: "destructive" });
      setSubmitting(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="nav-bar">
        <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-[hsl(44,84%,51%)]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm sm:text-base text-foreground tracking-wide uppercase">Vitmajer</span>
            <span className="text-[10px] text-muted-foreground tracking-widest hidden sm:block">Hromosvody</span>
          </div>
        </Link>
      </nav>

      <div className="page-content flex items-center justify-center min-h-[calc(100vh-var(--nav-height)-4rem)]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-[hsl(44,84%,51%)]" />
            </div>
            <CardTitle className="text-xl">Přihlášení</CardTitle>
            <p className="text-xs text-muted-foreground tracking-wider">HROMOSVODY VITMAJER</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                Přihlásit se
              </Button>
            </form>
            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">nebo</span>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/report/new")}>
              <FileText className="w-4 h-4 mr-2" />
              Vyplnit revizní zprávu
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
