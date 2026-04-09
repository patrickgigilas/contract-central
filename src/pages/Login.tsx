import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const EXTERNAL_SUPABASE_URL = "https://mwvbxojvmehbmmwhblta.supabase.co";
const GENERIC_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [domainWarning, setDomainWarning] = useState<string | null>(null);
  const [signupBlocked, setSignupBlocked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !companyName.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${EXTERNAL_SUPABASE_URL}/functions/v1/signup-with-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmJ4b2p2bWVoYm1td2hibHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjI5NTcsImV4cCI6MjA5MTA5ODk1N30.h_znuGtiNd1rhzY7Ves8d1YTunLkXtc4kOszHP241z8" },
        body: JSON.stringify({ email, password, full_name: fullName, company_name: companyName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erro", description: data.error || "Erro ao criar conta.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Bem-vindo ao tester." });
        navigate("/dashboard");
      }
    } catch {
      setLoading(false);
      toast({ title: "Erro", description: "Erro de conexão.", variant: "destructive" });
    }
  };

  const handleEmailBlur = async () => {
    if (!isSignup || !email.includes("@")) {
      setDomainWarning(null);
      setSignupBlocked(false);
      return;
    }
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || GENERIC_DOMAINS.includes(domain)) {
      setDomainWarning(null);
      setSignupBlocked(false);
      return;
    }
    try {
      const { data } = await supabase.rpc("get_company_by_domain" as any, { p_email: email });
      if (data && (Array.isArray(data) ? data.length > 0 : data)) {
        const name = Array.isArray(data) ? data[0]?.name : (data as any)?.name;
        setDomainWarning(`A empresa ${name || "encontrada"} já está cadastrada com este domínio. Peça ao administrador para te convidar, ou cadastre uma nova empresa.`);
        setSignupBlocked(true);
      } else {
        setDomainWarning(null);
        setSignupBlocked(false);
      }
    } catch {
      setDomainWarning(null);
      setSignupBlocked(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-foreground">tester</Link>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSignup ? "Crie sua conta" : "Entre na sua conta"}
          </p>
        </div>
        <form onSubmit={isSignup ? handleSignup : handleLogin} className="bg-card border rounded-xl p-6 space-y-4">
          {isSignup && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Minha Empresa" required />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="seu@email.com"
              required
            />
          </div>
          {domainWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              {domainWarning}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || (isSignup && signupBlocked)}>
            {loading ? "Aguarde..." : isSignup ? "Criar conta" : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button type="button" onClick={() => { setIsSignup(!isSignup); setDomainWarning(null); setSignupBlocked(false); }} className="text-primary hover:underline">
              {isSignup ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
