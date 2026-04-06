import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Brain, Bell, TrendingDown, Shield, FileText } from "lucide-react";

const solutions = [
  { icon: FileText, title: "Centralização automática", desc: "Importe contratos de DocuSign, ClickSign, Adobe Sign ou por e-mail." },
  { icon: Brain, title: "IA que organiza", desc: "Classificação e extração de dados automatizada por inteligência artificial." },
  { icon: Bell, title: "Alertas de vencimento", desc: "Nunca mais perca um prazo de renovação ou rescisão." },
  { icon: TrendingDown, title: "Insights de negociação", desc: "Dados concretos para negociar melhores condições." },
  { icon: Shield, title: "Procurement as a Service", desc: "Nossa equipe negocia por você e otimiza seus custos." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20">
          <div className="container max-w-4xl">
            <h1 className="text-4xl font-bold text-center mb-4">Sobre nós</h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              A tester é uma plataforma de gestão inteligente de contratos e procurement.
              Ajudamos empresas a centralizar, organizar e negociar melhor seus contratos,
              reduzindo custos e eliminando desperdícios.
            </p>
          </div>
        </section>

        <section className="py-16 bg-secondary/50">
          <div className="container max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-10">O que fazemos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {solutions.map((s) => (
                <div key={s.title} className="p-6 rounded-lg border bg-card">
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

        <section className="py-16">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-10">Resultados reais</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-extrabold text-primary">30%</div>
                <p className="text-sm text-muted-foreground mt-2">Redução média de custos com fornecedores</p>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary">100%</div>
                <p className="text-sm text-muted-foreground mt-2">Visibilidade sobre contratos ativos</p>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary">10x</div>
                <p className="text-sm text-muted-foreground mt-2">Mais poder de negociação com dados</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
