import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, FolderOpen, Plus, Upload, Mail, Settings, CreditCard,
  LogOut, ChevronRight, Menu, Trash2, Eye, LayoutDashboard, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Folder = Tables<"folders">;
type Contract = Tables<"contracts">;
type FolderPermission = Tables<"folder_permissions">;

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<string, string> = {
  active: "Ativo", expired: "Vencido", cancelled: "Cancelado",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, subscription, isAdmin, signOut } = useAuth();
  const [activePage, setActivePage] = useState<"dashboard" | "contratos" | "config" | "billing">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} transition-all bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col`}>
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="text-lg font-bold text-sidebar-primary-foreground">tester</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { key: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
            { key: "contratos" as const, icon: FileText, label: "Contratos" },
            ...(isAdmin ? [
              { key: "config" as const, icon: Settings, label: "Configurações" },
              { key: "billing" as const, icon: CreditCard, label: "Billing" },
            ] : []),
          ].map((item) => (
            <button key={item.key} onClick={() => setActivePage(item.key)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground ${activePage === item.key ? "bg-sidebar-accent" : ""}`}>
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-1 mb-2">
            <p className="text-xs text-sidebar-foreground/70 truncate">{profile?.email}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground w-full">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 gap-3 bg-background">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {activePage === "dashboard" ? "Dashboard" : activePage === "contratos" ? "Contratos" : activePage === "config" ? "Configurações" : "Billing"}
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {activePage === "dashboard" && <DashboardView />}
          {activePage === "contratos" && <ContractsView />}
          {activePage === "config" && isAdmin && <SettingsView />}
          {activePage === "billing" && isAdmin && <BillingView />}
        </main>
      </div>
    </div>
  );
}

/* ---- Dashboard Overview ---- */
function DashboardView() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ active: 0, expiring: 0, expired: 0, total: 0 });

  useEffect(() => {
    if (!profile?.company_id) return;
    const load = async () => {
      const { data } = await supabase.from("contracts").select("status, expiration_date").eq("company_id", profile.company_id!);
      if (!data) return;
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setStats({
        total: data.length,
        active: data.filter(c => c.status === "active").length,
        expired: data.filter(c => c.status === "expired").length,
        expiring: data.filter(c => c.status === "active" && c.expiration_date && new Date(c.expiration_date) <= in30).length,
      });
    };
    load();
  }, [profile?.company_id]);

  const cards = [
    { label: "Total de contratos", value: stats.total, color: "text-foreground" },
    { label: "Ativos", value: stats.active, color: "text-green-600" },
    { label: "Vencendo em 30 dias", value: stats.expiring, color: "text-yellow-600" },
    { label: "Vencidos", value: stats.expired, color: "text-red-600" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Visão geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="border rounded-lg p-4 bg-card">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Contracts View ---- */
function ContractsView() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSupplier, setUploadSupplier] = useState("");
  const [uploadValue, setUploadValue] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadStatus, setUploadStatus] = useState<Enums<"contract_status">>("active");
  const [uploadSignDate, setUploadSignDate] = useState("");
  const [uploadExpDate, setUploadExpDate] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const companyId = profile?.company_id;

  const loadFolders = async () => {
    if (!companyId) return;
    const { data } = await supabase.from("folders").select("*").eq("company_id", companyId).order("created_at");
    if (data) setFolders(data);
  };

  const loadContracts = async () => {
    if (!companyId) return;
    const { data } = await supabase.from("contracts").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (data) setContracts(data);
  };

  useEffect(() => { loadFolders(); loadContracts(); }, [companyId]);

  const currentFolders = folders.filter(f => f.parent_id === currentFolder);
  const currentContracts = contracts.filter(c => c.folder_id === currentFolder);

  const breadcrumb = () => {
    const parts: { id: string | null; name: string }[] = [{ id: null, name: "Contratos" }];
    let fId = currentFolder;
    const trail: Folder[] = [];
    while (fId) {
      const f = folders.find(fo => fo.id === fId);
      if (f) { trail.unshift(f); fId = f.parent_id; } else break;
    }
    trail.forEach(f => parts.push({ id: f.id, name: f.name }));
    return parts;
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !companyId) return;
    const { error } = await supabase.from("folders").insert({
      company_id: companyId, name: newFolderName.trim(), parent_id: currentFolder, created_by: profile?.id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewFolderName(""); setNewFolderOpen(false); loadFolders();
  };

  const deleteFolder = async (id: string) => {
    await supabase.from("folders").delete().eq("id", id);
    loadFolders(); loadContracts();
  };

  const deleteContract = async (id: string) => {
    await supabase.from("contracts").delete().eq("id", id);
    loadContracts();
  };

  const resetUpload = () => {
    setUploadTitle(""); setUploadSupplier(""); setUploadValue(""); setUploadCategory("");
    setUploadStatus("active"); setUploadSignDate(""); setUploadExpDate(""); setUploadFile(null);
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !currentFolder || !companyId) return;
    setUploading(true);

    let fileUrl: string | null = null;
    if (uploadFile) {
      const path = `${companyId}/${Date.now()}_${uploadFile.name}`;
      const { error: upErr } = await supabase.storage.from("contracts").upload(path, uploadFile);
      if (upErr) { toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("contracts").insert({
      company_id: companyId,
      folder_id: currentFolder,
      title: uploadTitle.trim(),
      supplier: uploadSupplier || null,
      value: uploadValue ? parseFloat(uploadValue) : null,
      category: uploadCategory || null,
      status: uploadStatus,
      signature_date: uploadSignDate || null,
      expiration_date: uploadExpDate || null,
      file_url: fileUrl,
      created_by: profile?.id,
    });

    setUploading(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    resetUpload(); setUploadOpen(false); loadContracts();
  };

  return (
    <>
      <nav className="flex items-center gap-1 text-sm mb-4">
        {breadcrumb().map((b, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <button onClick={() => setCurrentFolder(b.id)} className="hover:text-primary text-muted-foreground">{b.name}</button>
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2 mb-6">
        {isAdmin && (
          <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Nova pasta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova pasta</DialogTitle></DialogHeader>
              <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nome da pasta" />
              <Button onClick={createFolder}>Criar</Button>
            </DialogContent>
          </Dialog>
        )}

        {currentFolder && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Upload</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Upload de contrato</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Título do contrato *" />
                <Input value={uploadSupplier} onChange={e => setUploadSupplier(e.target.value)} placeholder="Fornecedor" />
                <Input value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} placeholder="Categoria" />
                <Input type="number" value={uploadValue} onChange={e => setUploadValue(e.target.value)} placeholder="Valor (R$)" />
                <Select value={uploadStatus} onValueChange={(v: Enums<"contract_status">) => setUploadStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Assinatura</label>
                    <Input type="date" value={uploadSignDate} onChange={e => setUploadSignDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Vencimento</label>
                    <Input type="date" value={uploadExpDate} onChange={e => setUploadExpDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadFile ? uploadFile.name : "Anexar PDF"}
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <Sparkles className="h-4 w-4 mr-2" /> Preencher automaticamente com IA (em breve)
                </Button>
              </div>
              <Button onClick={handleUpload} className="mt-2" disabled={uploading}>
                {uploading ? "Enviando..." : "Adicionar contrato"}
              </Button>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Upload via e-mail</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload via e-mail</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Envie seus contratos para:</p>
            <div className="bg-secondary rounded-md p-3 text-sm font-mono text-foreground select-all">empresa@tester.com.br</div>
          </DialogContent>
        </Dialog>
      </div>

      {currentFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {currentFolders.map(f => (
            <div key={f.id} className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors group">
              <button onClick={() => setCurrentFolder(f.id)} className="flex items-center gap-3 flex-1 text-left">
                <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
              </button>
              {isAdmin && (
                <button onClick={() => deleteFolder(f.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {currentFolder && currentContracts.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Fornecedor</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Valor</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Vencimento</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {currentContracts.map(c => (
                <tr key={c.id} className="border-t hover:bg-accent/50 group">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.supplier || "—"}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{c.value ? `R$ ${Number(c.value).toLocaleString("pt-BR")}` : "—"}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.expiration_date || "—"}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.file_url && (
                        <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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
        </div>
      )}

      {!currentFolder && currentFolders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma pasta encontrada.</p>
        </div>
      )}
    </>
  );
}

/* ---- Settings View (Admin only) ---- */
function SettingsView() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const companyId = profile?.company_id;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [permissions, setPermissions] = useState<FolderPermission[]>([]);
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [integrations, setIntegrations] = useState<Tables<"integrations">[]>([]);

  // New permission form
  const [permRole, setPermRole] = useState<Enums<"app_role">>("viewer");
  const [permFolder, setPermFolder] = useState("");
  const [permRead, setPermRead] = useState(true);
  const [permWrite, setPermWrite] = useState(false);

  // Integration form
  const [intProvider, setIntProvider] = useState<Enums<"integration_provider">>("docusign");
  const [intApiKey, setIntApiKey] = useState("");
  const [intSecret, setIntSecret] = useState("");
  const [intEmail, setIntEmail] = useState("");

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      const [f, p, pr, i] = await Promise.all([
        supabase.from("folders").select("*").eq("company_id", companyId),
        supabase.from("folder_permissions").select("*").eq("company_id", companyId),
        supabase.from("profiles").select("*").eq("company_id", companyId),
        supabase.from("integrations").select("*").eq("company_id", companyId),
      ]);
      if (f.data) setFolders(f.data);
      if (p.data) setPermissions(p.data);
      if (pr.data) setProfiles(pr.data);
      if (i.data) setIntegrations(i.data);
    };
    load();
  }, [companyId]);

  const addPermission = async () => {
    if (!permFolder || !companyId) return;
    const { error } = await supabase.from("folder_permissions").insert({
      company_id: companyId, role: permRole, folder_id: permFolder, can_read: permRead, can_write: permWrite,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    const { data } = await supabase.from("folder_permissions").select("*").eq("company_id", companyId);
    if (data) setPermissions(data);
  };

  const removePermission = async (id: string) => {
    await supabase.from("folder_permissions").delete().eq("id", id);
    setPermissions(permissions.filter(p => p.id !== id));
  };

  const addIntegration = async () => {
    if (!companyId) return;
    const { error } = await supabase.from("integrations").insert({
      company_id: companyId, provider: intProvider, api_key: intApiKey || null, api_secret: intSecret || null, email_login: intEmail || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setIntApiKey(""); setIntSecret(""); setIntEmail("");
    const { data } = await supabase.from("integrations").select("*").eq("company_id", companyId);
    if (data) setIntegrations(data);
  };

  const removeIntegration = async (id: string) => {
    await supabase.from("integrations").delete().eq("id", id);
    setIntegrations(integrations.filter(i => i.id !== id));
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin", finance: "Financeiro", legal: "Jurídico", commercial: "Comercial", viewer: "Visualizador", none: "Sem acesso",
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Users */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Usuários da empresa</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 font-medium text-muted-foreground">E-mail</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Papel</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 text-foreground">{p.full_name}</td>
                  <td className="p-3 text-muted-foreground">{p.email}</td>
                  <td className="p-3"><Badge variant="secondary">{roleLabels[p.role] || p.role}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Folder Permissions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Permissões por pasta</h2>
        <div className="border rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={permRole} onValueChange={(v: Enums<"app_role">) => setPermRole(v)}>
              <SelectTrigger><SelectValue placeholder="Papel" /></SelectTrigger>
              <SelectContent>
                {["finance", "legal", "commercial", "viewer"].map(r => (
                  <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={permFolder} onValueChange={setPermFolder}>
              <SelectTrigger><SelectValue placeholder="Pasta" /></SelectTrigger>
              <SelectContent>
                {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={permRead} onChange={e => setPermRead(e.target.checked)} /> Leitura
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={permWrite} onChange={e => setPermWrite(e.target.checked)} /> Escrita
            </label>
          </div>
          <Button size="sm" onClick={addPermission}>Adicionar permissão</Button>
        </div>

        {permissions.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Papel</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Pasta</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Permissões</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3"><Badge variant="secondary">{roleLabels[p.role] || p.role}</Badge></td>
                    <td className="p-3 text-muted-foreground">{folders.find(f => f.id === p.folder_id)?.name || p.folder_id}</td>
                    <td className="p-3 text-muted-foreground">
                      {p.can_read && "Leitura"}{p.can_read && p.can_write && " + "}{p.can_write && "Escrita"}
                    </td>
                    <td className="p-3">
                      <button onClick={() => removePermission(p.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Integrations */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Integrações</h2>
        <div className="border rounded-lg p-4 mb-4 space-y-3">
          <Select value={intProvider} onValueChange={(v: Enums<"integration_provider">) => setIntProvider(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="docusign">DocuSign</SelectItem>
              <SelectItem value="adobe_sign">Adobe Sign</SelectItem>
              <SelectItem value="clicksign">ClickSign</SelectItem>
              <SelectItem value="d4sign">D4Sign</SelectItem>
            </SelectContent>
          </Select>
          <Input value={intApiKey} onChange={e => setIntApiKey(e.target.value)} placeholder="API Key" />
          <Input value={intSecret} onChange={e => setIntSecret(e.target.value)} placeholder="API Secret / Token" type="password" />
          <Input value={intEmail} onChange={e => setIntEmail(e.target.value)} placeholder="E-mail de login" />
          <Button size="sm" onClick={addIntegration}>Salvar integração</Button>
        </div>

        {integrations.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Provedor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">E-mail</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {integrations.map(i => (
                  <tr key={i.id} className="border-t">
                    <td className="p-3 text-foreground capitalize">{i.provider.replace("_", " ")}</td>
                    <td className="p-3 text-muted-foreground">{i.email_login || "—"}</td>
                    <td className="p-3">
                      <button onClick={() => removeIntegration(i.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---- Billing View ---- */
function BillingView() {
  const { subscription, profile } = useAuth();
  const [contractCount, setContractCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!profile?.company_id) return;
    const load = async () => {
      const [c, u] = await Promise.all([
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("company_id", profile.company_id!),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", profile.company_id!),
      ]);
      setContractCount(c.count || 0);
      setUserCount(u.count || 0);
    };
    load();
  }, [profile?.company_id]);

  const planLabels: Record<string, string> = { basic: "Starter – R$ 350/mês", pro: "Pro – R$ 599/mês", enterprise: "Enterprise" };
  const statusLabels: Record<string, string> = { active: "Ativo", inactive: "Inativo", past_due: "Em atraso" };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Billing</h2>
      <div className="border rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-1">Plano atual</h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">{planLabels[subscription?.plan || "basic"]}</span>
            <Badge>{statusLabels[subscription?.status || "active"]}</Badge>
          </div>
          {subscription?.current_period_end && (
            <p className="text-sm text-muted-foreground mt-1">
              Renovação em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <div className="border-t pt-4 mb-6">
          <h3 className="text-sm font-medium mb-3">Uso</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Contratos</p>
              <p className="text-lg font-semibold">{contractCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usuários</p>
              <p className="text-lg font-semibold">{userCount}</p>
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">Em breve: gestão completa de billing integrada com Stripe.</p>
        </div>
      </div>
    </div>
  );
}
