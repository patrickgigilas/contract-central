import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { AlertTriangle, Brain, Bell, TrendingDown, FileText, Shield, DollarSign, ArrowRight } from "lucide-react";

const problems = [
  { icon: AlertTriangle, title: "Sem visibilidade", desc: "Empresas não sabem quantos contratos têm nem onde estão." },
  { icon: Bell, title: "Prazos perdidos", desc: "Renovações automáticas passam despercebidas, gerando custos extras." },
  { icon: TrendingDown, title: "Negociação fraca", desc: "Sem dados, sem poder de negociação com fornecedores." },
  { icon: DollarSign, title: "Desperdício oculto", desc: "Softwares e serviços pagos sem uso real." },
];

const solutions = [
  { icon: FileText, title: "Centralização automática", desc: "Importe contratos de DocuSign, ClickSign, Adobe Sign ou por e-mail." },
  { icon: Brain, title: "IA que organiza", desc: "Classificação e extração de dados automatizada por inteligência artificial." },
  { icon: Bell, title: "Alertas de vencimento", desc: "Nunca mais perca um prazo de renovação ou rescisão." },
  { icon: TrendingDown, title: "Insights de negociação", desc: "Dados concretos para negociar melhores condições." },
  { icon: Shield, title: "Procurement as a Service", desc: "Nossa equipe negocia por você e otimiza seus custos." },
];

const benefits = [
  { value: "30%", label: "Redução média de custos com fornecedores" },
  { value: "100%", label: "Visibilidade sobre contratos ativos" },
  { value: "10x", label: "Mais poder de negociação com dados" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Pare de perder dinheiro com contratos que você{" "}
            <span className="text-primary">não controla</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Centralize, organize com IA, receba alertas e negocie melhor. 
            Tudo em uma plataforma feita para quem quer controle real.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">Ver planos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="py-20 bg-secondary/50">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">O problema é real</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            A maioria das empresas perde até 30% do orçamento com contratos mal geridos.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((p) => (
              <div key={p.title} className="flex gap-4 p-6 rounded-lg bg-card border">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <p.icon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">A solução: tester</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Uma plataforma completa para gestão inteligente de contratos e procurement.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((s) => (
              <div key={s.title} className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-secondary/50">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Resultados reais</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {benefits.map((b) => (
              <div key={b.label}>
                <div className="text-4xl font-extrabold text-primary">{b.value}</div>
                <p className="text-sm text-muted-foreground mt-2">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para assumir o controle?</h2>
          <p className="text-muted-foreground mb-8">
            Crie sua conta em segundos e comece a organizar seus contratos hoje.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Criar conta gratuita <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} tester. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
