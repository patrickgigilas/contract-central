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
  LogOut, ChevronRight, Menu, Trash2, Eye, LayoutDashboard, Sparkles, Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

const EXTERNAL_SUPABASE_URL = "https://mwvbxojvmehbmmwhblta.supabase.co";

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

const LoadingSkeleton = () => (
  <div className="space-y-3">
    <div className="h-16 rounded-lg bg-muted animate-pulse" />
    <div className="h-16 rounded-lg bg-muted animate-pulse" />
    <div className="h-16 rounded-lg bg-muted animate-pulse" />
  </div>
);

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
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.company_id) return;
    const load = async () => {
      setLoading(true);
      // Try dashboard_summary view first, fallback to manual calc
      const { data, error } = await supabase.from("dashboard_summary" as any).select("*").eq("company_id", profile.company_id!).single();
      if (data && !error) {
        setStats(data);
      } else {
        // Fallback: manual calculation
        const { data: contracts } = await supabase.from("contracts").select("status, expiration_date, value").eq("company_id", profile.company_id!);
        if (contracts) {
          const now = new Date();
          const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const active = contracts.filter(c => c.status === "active");
          setStats({
            active_contracts: active.length,
            expired_contracts: contracts.filter(c => c.status === "expired").length,
            expiring_soon: active.filter(c => c.expiration_date && new Date(c.expiration_date) <= in30).length,
            total_value: active.reduce((sum, c) => sum + (Number(c.value) || 0), 0),
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [profile?.company_id]);

  if (loading) return <div><h2 className="text-lg font-semibold mb-6">Visão geral</h2><LoadingSkeleton /></div>;

  const cards = [
    { label: "Contratos ativos", value: stats?.active_contracts ?? 0, color: "text-green-600" },
    { label: "Vencendo em breve", value: stats?.expiring_soon ?? 0, color: "text-yellow-600" },
    { label: "Vencidos", value: stats?.expired_contracts ?? 0, color: "text-red-600" },
    { label: "Valor total ativo", value: `R$ ${Number(stats?.total_value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-blue-600" },
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
  const [contracts, setContracts] = useState<(Contract & { expiration_alert?: string })[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSupplier, setUploadSupplier] = useState("");
  const [uploadValue, setUploadValue] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadStatus, setUploadStatus] = useState<Enums<"contract_status">>("active");
  const [uploadSignDate, setUploadSignDate] = useState("");
  const [uploadExpDate, setUploadExpDate] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);

  const companyId = profile?.company_id;

  const loadFolders = async () => {
    if (!companyId) return;
    const { data } = await supabase.from("folders").select("*").eq("company_id", companyId).order("created_at");
    if (data) setFolders(data);
  };

  const loadContracts = async () => {
    if (!companyId) return;
    const { data } = await supabase.from("contracts").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (data) {
      // Calculate expiration_alert client-side
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const enriched = data.map((c: any) => ({
        ...c,
        expiration_alert: c.status === "active" && c.expiration_date && new Date(c.expiration_date) <= in30 && new Date(c.expiration_date) >= now ? "expiring_soon" : null,
      }));
      setContracts(enriched);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadFolders(), loadContracts()]);
      setLoading(false);
    };
    load();
  }, [companyId]);

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
    if (!window.confirm("Excluir esta pasta? Todos os contratos dentro serão removidos.")) return;
    await supabase.from("folders").delete().eq("id", id);
    loadFolders(); loadContracts();
  };

  const deleteContract = async (id: string) => {
    if (!window.confirm("Excluir este contrato?")) return;
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

  const handleAiExtract = async () => {
    if (!uploadFile) {
      toast({ title: "Erro", description: "Anexe um PDF primeiro.", variant: "destructive" });
      return;
    }
    setAiExtracting(true);
    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(",")[1]);
          r.readAsDataURL(file);
        });
      const base64 = await toBase64(uploadFile);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${EXTERNAL_SUPABASE_URL}/functions/v1/ai-extract-contract`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contract_text: base64 }),
      });
      const data = await res.json();
      if (res.ok && data.extracted) {
        const e = data.extracted;
        if (e.title) setUploadTitle(e.title);
        if (e.supplier) setUploadSupplier(e.supplier);
        if (e.value) setUploadValue(String(e.value));
        if (e.category) setUploadCategory(e.category);
        if (e.signature_date) setUploadSignDate(e.signature_date);
        if (e.expiration_date) setUploadExpDate(e.expiration_date);
        toast({ title: "Sucesso", description: "Dados extraídos com sucesso! Revise e confirme." });
      } else {
        toast({ title: "Erro", description: "Não foi possível extrair os dados. Preencha manualmente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível extrair os dados. Preencha manualmente.", variant: "destructive" });
    }
    setAiExtracting(false);
  };

  if (loading) return <LoadingSkeleton />;

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

        {!currentFolder && (
          <p className="text-sm text-muted-foreground py-2">Selecione ou crie uma pasta para fazer upload de contratos.</p>
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
                <Button variant="outline" size="sm" className="w-full" onClick={handleAiExtract} disabled={aiExtracting}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {aiExtracting ? "Extraindo dados..." : "Preencher automaticamente com IA"}
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
                <th className="text-left p-3 font-medium text-muted-foreground">Alerta</th>
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
                    {c.expiration_alert === "expiring_soon" && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠ Vence em breve</Badge>
                    )}
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
  const [loading, setLoading] = useState(true);

  // Permission form
  const [permRole, setPermRole] = useState<Enums<"app_role">>("viewer");
  const [permFolder, setPermFolder] = useState("");
  const [permRead, setPermRead] = useState(true);
  const [permWrite, setPermWrite] = useState(false);

  // Integration form
  const [intProvider, setIntProvider] = useState<Enums<"integration_provider">>("docusign");
  const [intApiKey, setIntApiKey] = useState("");
  const [intSecret, setIntSecret] = useState("");
  const [intEmail, setIntEmail] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [invites, setInvites] = useState<any[]>([]);

  // Email slug
  const [emailSlug, setEmailSlug] = useState("");

  // Email connections
  const [emailConns, setEmailConns] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
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

      // Load invites
      try {
        const { data: inv } = await supabase.from("invites" as any).select("*").eq("company_id", companyId).order("created_at", { ascending: false });
        if (inv) setInvites(inv);
      } catch {}

      // Load email slug
      try {
        const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single();
        if (company && (company as any).email_slug) setEmailSlug((company as any).email_slug);
      } catch {}

      // Load email connections
      try {
        const { data: ec } = await supabase.from("email_connections" as any).select("*").eq("company_id", companyId);
        if (ec) setEmailConns(ec);
      } catch {}

      setLoading(false);
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

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !companyId) return;
    const { error } = await supabase.from("invites" as any).insert({
      company_id: companyId, email: inviteEmail, role: inviteRole, invited_by: profile?.id,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sucesso", description: `Convite enviado para ${inviteEmail}` });
    setInviteEmail("");
    const { data } = await supabase.from("invites" as any).select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (data) setInvites(data);
  };

  const cancelInvite = async (id: string) => {
    await supabase.from("invites" as any).delete().eq("id", id);
    setInvites(invites.filter(i => i.id !== id));
  };

  const removeEmailConn = async (id: string) => {
    await supabase.from("email_connections" as any).delete().eq("id", id);
    setEmailConns(emailConns.filter(c => c.id !== id));
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin", finance: "Financeiro", legal: "Jurídico", commercial: "Comercial", viewer: "Visualizador", none: "Sem acesso",
  };

  if (loading) return <LoadingSkeleton />;

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

      {/* Invite users */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Convidar usuários</h2>
        <div className="border rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="E-mail do convidado" className="sm:col-span-1" />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger><SelectValue placeholder="Papel" /></SelectTrigger>
              <SelectContent>
                {["finance", "legal", "commercial", "viewer"].map(r => (
                  <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={sendInvite}>Convidar</Button>
          </div>
        </div>
        {invites.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">E-mail</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Papel</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Expira em</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv: any) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-3 text-foreground">{inv.email}</td>
                    <td className="p-3"><Badge variant="secondary">{roleLabels[inv.role] || inv.role}</Badge></td>
                    <td className="p-3 text-muted-foreground">{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="p-3">
                      <button onClick={() => cancelInvite(inv.id)} className="text-muted-foreground hover:text-destructive">
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

      {/* Email reception */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recebimento por email</h2>
        <div className="border rounded-lg p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Encaminhe contratos assinados para o endereço abaixo e eles serão importados automaticamente:</p>
          <div className="flex items-center gap-2">
            <div className="bg-secondary rounded-md p-3 text-sm font-mono text-foreground flex-1 select-all">
              {emailSlug ? `${emailSlug}@tester.com.br` : "empresa@tester.com.br"}
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(emailSlug ? `${emailSlug}@tester.com.br` : "empresa@tester.com.br");
              toast({ title: "Copiado!", description: "Endereço copiado para a área de transferência." });
            }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Funciona com qualquer plataforma: ClickSign, DocuSign, Adobe Sign, email comum, etc.</p>
        </div>
      </section>

      {/* Email OAuth */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Sincronizar caixa de email</h2>
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => toast({ title: "Em breve!", description: "Esta funcionalidade está sendo desenvolvida." })}>
              Conectar Gmail
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => toast({ title: "Em breve!", description: "Esta funcionalidade está sendo desenvolvida." })}>
              Conectar Outlook
            </Button>
          </div>
          {emailConns.length > 0 && (
            <div className="border rounded-lg overflow-hidden mt-3">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">E-mail</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Provedor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Última sync</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {emailConns.map((ec: any) => (
                    <tr key={ec.id} className="border-t">
                      <td className="p-3 text-foreground">{ec.email}</td>
                      <td className="p-3 text-muted-foreground capitalize">{ec.provider}</td>
                      <td className="p-3 text-muted-foreground">{ec.last_sync_status || "—"}</td>
                      <td className="p-3 text-muted-foreground">{ec.last_sync_at ? new Date(ec.last_sync_at).toLocaleString("pt-BR") : "—"}</td>
                      <td className="p-3">
                        <button onClick={() => removeEmailConn(ec.id)} className="text-muted-foreground hover:text-destructive">
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
