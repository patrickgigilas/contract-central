import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  FolderOpen,
  Plus,
  Upload,
  Mail,
  Settings,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react";
import { defaultFolders, mockContracts, type Contract, type Folder } from "@/data/mockContracts";

const statusColors: Record<string, string> = {
  ativo: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
  pendente: "bg-yellow-100 text-yellow-800",
};

export default function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>(defaultFolders);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentFolders = folders.filter((f) => f.parentId === currentFolder);
  const currentContracts = contracts.filter((c) => c.folderId === currentFolder);

  const breadcrumb = () => {
    const parts: { id: string | null; name: string }[] = [{ id: null, name: "Contratos" }];
    let fId = currentFolder;
    const trail: Folder[] = [];
    while (fId) {
      const f = folders.find((fo) => fo.id === fId);
      if (f) { trail.unshift(f); fId = f.parentId; } else break;
    }
    trail.forEach((f) => parts.push({ id: f.id, name: f.name }));
    return parts;
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const id = Date.now().toString();
    setFolders([...folders, { id, name: newFolderName.trim(), parentId: currentFolder }]);
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const uploadContract = () => {
    if (!uploadName.trim() || !currentFolder) return;
    const c: Contract = {
      id: Date.now().toString(),
      name: uploadName.trim(),
      type: "Manual",
      date: new Date().toISOString().slice(0, 10),
      status: "pendente",
      folderId: currentFolder,
    };
    setContracts([...contracts, c]);
    setUploadName("");
    setUploadOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} transition-all bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col`}>
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="text-lg font-bold text-sidebar-primary-foreground">tester</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setCurrentFolder(null)} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground">
            <FileText className="h-4 w-4" /> Contratos
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground opacity-60">
            <Settings className="h-4 w-4" /> Configurações
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground opacity-60">
            <CreditCard className="h-4 w-4" /> Billing
          </button>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 gap-3 bg-background">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumb().map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <button onClick={() => setCurrentFolder(b.id)} className="hover:text-primary text-muted-foreground">
                  {b.name}
                </button>
              </span>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Nova pasta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova pasta</DialogTitle></DialogHeader>
                <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nome da pasta" />
                <Button onClick={createFolder}>Criar</Button>
              </DialogContent>
            </Dialog>

            {currentFolder && (
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Upload</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Upload de contrato</DialogTitle></DialogHeader>
                  <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Nome do contrato" />
                  <p className="text-xs text-muted-foreground">Simulação de upload — em produção, envie o arquivo aqui.</p>
                  <Button onClick={uploadContract}>Adicionar</Button>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Upload via e-mail</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Upload via e-mail</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Envie seus contratos para o e-mail abaixo e eles serão importados automaticamente:
                </p>
                <div className="bg-secondary rounded-md p-3 text-sm font-mono text-foreground select-all">
                  empresa@tester.com.br
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Folders */}
          {currentFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {currentFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCurrentFolder(f.id)}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                >
                  <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Contracts table */}
          {currentFolder && currentContracts.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentContracts.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-accent/50">
                      <td className="p-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {c.name}
                      </td>
                      <td className="p-3 text-muted-foreground">{c.type}</td>
                      <td className="p-3 text-muted-foreground">{c.date}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={statusColors[c.status]}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentFolder && currentContracts.length === 0 && currentFolders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum contrato nesta pasta.</p>
              <p className="text-xs mt-1">Use o botão Upload para adicionar contratos.</p>
            </div>
          )}

          {!currentFolder && currentFolders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Crie uma pasta para organizar seus contratos.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
