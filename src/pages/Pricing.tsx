import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R$ 350",
    period: "/mês",
    description: "Para empresas que querem centralizar contratos.",
    features: [
      "Centralização de contratos (DocuSign, ClickSign, Adobe Sign)",
      "Upload manual de contratos",
      "IA que classifica contratos automaticamente",
      "Categorias: Venda, Compra, Institucional, PJ",
    ],
    cta: "Começar agora",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 599",
    period: "/mês",
    description: "Para quem quer inteligência e controle total.",
    features: [
      "Tudo do Starter",
      "Alertas de vencimento",
      "Extração automática de dados",
      "Insights de negociação",
      "Gestão de prazos",
    ],
    cta: "Começar agora",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Para operações complexas com procurement dedicado.",
    features: [
      "Tudo do Pro",
      "BPO de procurement",
      "Negociação de contratos",
      "Análise de cost leakage",
      "Identificação de despesas sem contrato",
      "Otimização de custos",
    ],
    cta: "Falar com atendente",
    href: "https://wa.me/5519997950007",
    highlight: false,
    external: true,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-20">
        <div className="container max-w-5xl">
          <h1 className="text-4xl font-bold text-center mb-4">Planos e preços</h1>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Escolha o plano ideal para o momento da sua empresa.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlight ? "border-primary ring-2 ring-primary/20 bg-card" : "bg-card"
                }`}
              >
                {plan.highlight && (
                  <span className="text-xs font-semibold text-primary mb-2">Mais popular</span>
                )}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.external ? (
                  <Button variant={plan.highlight ? "default" : "outline"} className="w-full" asChild>
                    <a href={plan.href} target="_blank" rel="noopener noreferrer">{plan.cta}</a>
                  </Button>
                ) : (
                  <Button variant={plan.highlight ? "default" : "outline"} className="w-full" asChild>
                    <Link to={plan.href}>{plan.cta}</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
