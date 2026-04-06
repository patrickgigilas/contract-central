import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-bold text-foreground">
          tester
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Preços
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Começar agora</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
