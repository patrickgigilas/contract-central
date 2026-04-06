import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} tester. Todos os direitos reservados.</span>
        <div className="flex items-center gap-4">
          <Link to="/privacidade" className="hover:text-foreground transition-colors">
            Política de Privacidade
          </Link>
          <a
            href="https://wa.me/5519997950007"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Contate-nos
          </a>
        </div>
      </div>
    </footer>
  );
}
