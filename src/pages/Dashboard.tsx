import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, FolderOpen, Plus, Upload, Mail, Settings, CreditCard,
  LogOut, ChevronRight, Menu, Trash2, Eye,
} from "lucide-react";
import { defaultFolders, mockContracts, type Contract, type Folder } from "@/data/mockContracts";

const statusColors: Record<string, string> = {
  ativo: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
  pendente: "bg-yellow-100 text-yellow-800",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>(defaultFolders);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<"contratos" | "config" | "billing">("contratos");

  // Upload form
  const [uploadName, setUploadName] = useState("");
  const [uploadTipo, setUploadTipo] = useState("");
  const [uploadValor, setUploadValor] = useState("");
  const [uploadVencimento, setUploadVencimento] = useState("");
  const [uploadParte, setUploadParte] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFolders([...folders, { id: Date.now().toString(), name: newFolderName.trim(), parentId: currentFolder }]);
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const resetUploadForm = () => {
    setUploadName(""); setUploadTipo(""); setUploadValor("");
    setUploadVencimento(""); setUploadParte(""); setUploadFile(null);
  };

  const uploadContract = () => {
    if (!uploadName.trim() || !currentFolder) return;
    const fileUrl = uploadFile ? URL.createObjectURL(uploadFile) : undefined;
    const c: Contract = {
      id: Date.now().toString(),
      name: uploadName.trim(),
      type: uploadTipo || "Manual",
      date: new Date().toISOString().slice(0, 10),
      status: "pendente",
      folderId: currentFolder,
      fileUrl,
      fileName: uploadFile?.name,
      valor: uploadValor || undefined,
      vencimento: uploadVencimento || undefined,
      parteContratante: uploadParte || undefined,
    };
    setContracts([...contracts, c]);
    resetUploadForm();
    setUploadOpen(false);
  };

  const deleteContract = (id: string) => {
    setContracts(contracts.filter((c) => c.id !== id));
  };

  const deleteFolder = (id: string) => {
    setFolders(folders.filter((f) => f.id !== id && f.parentId !== id));
    setContracts(contracts.filter((c) => c.folderId !== id));
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} transition-all bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col`}>
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="text-lg font-bold text-sidebar-primary-foreground">tester</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => { setActivePage("contratos"); setCurrentFolder(null); }} className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground ${activePage === "contratos" ? "bg-sidebar-accent" : ""}`}>
            <FileText className="h-4 w-4" /> Contratos
          </button>
          <button onClick={() => setActivePage("config")} className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground ${activePage === "config" ? "bg-sidebar-accent" : ""}`}>
            <Settings className="h-4 w-4" /> Configurações
          </button>
          <button onClick={() => setActivePage("billing")} className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground ${activePage === "billing" ? "bg-sidebar-accent" : ""}`}>
            <CreditCard className="h-4 w-4" /> Billing
          </button>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground w-full">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 gap-3 bg-background">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {activePage === "contratos" ? "Contratos" : activePage === "config" ? "Configurações" : "Billing"}
          </span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activePage === "contratos" && <ContractsView
            folders={folders} contracts={contracts} currentFolder={currentFolder}
            currentFolders={currentFolders} currentContracts={currentContracts}
            setCurrentFolder={setCurrentFolder} breadcrumb={breadcrumb}
            newFolderOpen={newFolderOpen} setNewFolderOpen={setNewFolderOpen}
            newFolderName={newFolderName} setNewFolderName={setNewFolderName}
            createFolder={createFolder} uploadOpen={uploadOpen} setUploadOpen={setUploadOpen}
            emailOpen={emailOpen} setEmailOpen={setEmailOpen}
            uploadName={uploadName} setUploadName={setUploadName}
            uploadTipo={uploadTipo} setUploadTipo={setUploadTipo}
            uploadValor={uploadValor} setUploadValor={setUploadValor}
            uploadVencimento={uploadVencimento} setUploadVencimento={setUploadVencimento}
            uploadParte={uploadParte} setUploadParte={setUploadParte}
            uploadFile={uploadFile} setUploadFile={setUploadFile}
            fileInputRef={fileInputRef} uploadContract={uploadContract}
            deleteContract={deleteContract} deleteFolder={deleteFolder}
          />}
          {activePage === "config" && <SettingsView folders={folders} />}
          {activePage === "billing" && <BillingView />}
        </main>
      </div>
    </div>
  );
}

/* ---- Contracts View ---- */
function ContractsView(props: any) {
  const {
    currentFolder, currentFolders, currentContracts, setCurrentFolder, breadcrumb,
    newFolderOpen, setNewFolderOpen, newFolderName, setNewFolderName, createFolder,
    uploadOpen, setUploadOpen, emailOpen, setEmailOpen,
    uploadName, setUploadName, uploadTipo, setUploadTipo,
    uploadValor, setUploadValor, uploadVencimento, setUploadVencimento,
    uploadParte, setUploadParte, uploadFile, setUploadFile,
    fileInputRef, uploadContract, deleteContract, deleteFolder,
  } = props;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm mb-4">
        {breadcrumb().map((b: any, i: number) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <button onClick={() => setCurrentFolder(b.id)} className="hover:text-primary text-muted-foreground">{b.name}</button>
          </span>
        ))}
      </nav>

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
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Upload de contrato</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Nome do contrato *" />
                <Input value={uploadTipo} onChange={(e) => setUploadTipo(e.target.value)} placeholder="Tipo (ex: Compra, Venda)" />
                <Input value={uploadParte} onChange={(e) => setUploadParte(e.target.value)} placeholder="Parte contratante" />
                <Input value={uploadValor} onChange={(e) => setUploadValor(e.target.value)} placeholder="Valor (ex: R$ 5.000/mês)" />
                <Input type="date" value={uploadVencimento} onChange={(e) => setUploadVencimento(e.target.value)} placeholder="Data de vencimento" />
                <div>
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadFile ? uploadFile.name : "Anexar PDF"}
                  </Button>
                </div>
              </div>
              <Button onClick={uploadContract} className="mt-2">Adicionar contrato</Button>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Upload via e-mail</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload via e-mail</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Envie seus contratos para o e-mail abaixo:</p>
            <div className="bg-secondary rounded-md p-3 text-sm font-mono text-foreground select-all">empresa@tester.com.br</div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders */}
      {currentFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {currentFolders.map((f: any) => (
            <div key={f.id} className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors group">
              <button onClick={() => setCurrentFolder(f.id)} className="flex items-center gap-3 flex-1 text-left">
                <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
              </button>
              {f.id !== "compra" && f.id !== "venda" && (
                <button onClick={() => deleteFolder(f.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
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
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Parte</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Valor</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Vencimento</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {currentContracts.map((c: Contract) => (
                <tr key={c.id} className="border-t hover:bg-accent/50 group">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.type}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{c.parteContratante || "—"}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{c.valor || "—"}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.vencimento || c.date}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className={statusColors[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.fileUrl && (
                        <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <button onClick={() => deleteContract(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
    </>
  );
}

/* ---- Settings View ---- */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockUserAccess, type UserAccess } from "@/data/mockContracts";

function SettingsView({ folders }: { folders: Folder[] }) {
  const [accesses, setAccesses] = useState<UserAccess[]>(mockUserAccess);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [newRole, setNewRole] = useState<"visualizar" | "editar">("visualizar");

  const addAccess = () => {
    if (!newEmail.trim() || !newFolder) return;
    setAccesses([...accesses, {
      id: Date.now().toString(), email: newEmail.trim(), name: newName.trim() || newEmail.trim(),
      folderId: newFolder, role: newRole,
    }]);
    setNewEmail(""); setNewName(""); setNewFolder(""); setNewRole("visualizar");
  };

  const removeAccess = (id: string) => setAccesses(accesses.filter((a) => a.id !== id));

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Gestão de acessos</h2>
      <p className="text-sm text-muted-foreground mb-6">Defina quais usuários têm acesso a cada pasta.</p>

      {/* Add access */}
      <div className="border rounded-lg p-4 mb-6 space-y-3">
        <h3 className="text-sm font-medium">Adicionar acesso</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" />
          <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="E-mail *" />
          <Select value={newFolder} onValueChange={setNewFolder}>
            <SelectTrigger><SelectValue placeholder="Pasta" /></SelectTrigger>
            <SelectContent>
              {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newRole} onValueChange={(v: "visualizar" | "editar") => setNewRole(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="visualizar">Visualizar</SelectItem>
              <SelectItem value="editar">Editar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={addAccess}>Adicionar</Button>
      </div>

      {/* Access list */}
      {accesses.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Pasta</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Permissão</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {accesses.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium text-foreground">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{folders.find((f) => f.id === a.folderId)?.name || a.folderId}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{a.role}</Badge>
                  </td>
                  <td className="p-3">
                    <button onClick={() => removeAccess(a.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---- Billing View ---- */
function BillingView() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Billing</h2>
      <div className="border rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-1">Plano atual</h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">Starter</span>
            <Badge>Ativo</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">R$ 350/mês • Renovação em 15/07/2025</p>
        </div>

        <div className="border-t pt-4 mb-6">
          <h3 className="text-sm font-medium mb-3">Uso</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Contratos</p>
              <p className="text-lg font-semibold">4 / 50</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usuários</p>
              <p className="text-lg font-semibold">1 / 5</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-medium mb-2">Ações</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Alterar plano</Button>
            <Button variant="outline" size="sm">Atualizar pagamento</Button>
            <Button variant="outline" size="sm">Baixar faturas</Button>
          </div>
          <p className="text-xs text-muted-foreground">Em breve: gestão completa de billing integrada.</p>
        </div>
      </div>
    </div>
  );
}
