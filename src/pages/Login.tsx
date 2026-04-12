import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Zap, LogIn, Loader2 } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Zadejte e-mailovou adresu.";
    else if (!EMAIL_RE.test(email)) next.email = "Neplatný formát e-mailu.";
    if (!password) next.password = "Zadejte heslo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm sm:text-base text-foreground tracking-wide uppercase">Revizní mistr</span>
            <span className="text-[10px] text-muted-foreground tracking-widest hidden sm:block">Správa revizí LPS</span>
          </div>
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </nav>

      <div className="page-content flex items-center justify-center min-h-[calc(100vh-var(--nav-height)-4rem)]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl">Přihlášení</CardTitle>
            <p className="text-xs text-muted-foreground tracking-wider">REVIZNÍ MISTR</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                  autoComplete="email"
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                  autoComplete="current-password"
                  className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                Přihlásit se
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
