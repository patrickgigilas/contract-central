import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container max-w-3xl prose prose-sm dark:prose-invert">
          <h1>Política de Privacidade</h1>
          <p>Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          <h2>1. Dados coletados</h2>
          <p>Coletamos informações fornecidas por você ao utilizar a plataforma, como nome, e-mail e dados de contratos enviados.</p>
          <h2>2. Uso dos dados</h2>
          <p>Seus dados são utilizados exclusivamente para o funcionamento da plataforma, incluindo organização de contratos, alertas e insights.</p>
          <h2>3. Compartilhamento</h2>
          <p>Não compartilhamos seus dados com terceiros, exceto quando necessário para o funcionamento dos serviços contratados.</p>
          <h2>4. Segurança</h2>
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado.</p>
          <h2>5. Contato</h2>
          <p>Para dúvidas sobre esta política, entre em contato pelo <a href="https://wa.me/5519997950007" target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
