export interface Contract {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "ativo" | "vencido" | "pendente";
  folderId: string;
  fileUrl?: string;
  fileName?: string;
  valor?: string;
  vencimento?: string;
  parteContratante?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface UserAccess {
  id: string;
  email: string;
  name: string;
  folderId: string;
  role: "visualizar" | "editar";
}

export const defaultFolders: Folder[] = [
  { id: "compra", name: "Contratos de Compra", parentId: null },
  { id: "venda", name: "Contratos de Venda", parentId: null },
];

export const mockContracts: Contract[] = [
  { id: "1", name: "Contrato AWS 2024", type: "Compra", date: "2024-01-15", status: "ativo", folderId: "compra", valor: "R$ 12.000/mês", vencimento: "2025-01-15", parteContratante: "Amazon Web Services" },
  { id: "2", name: "Contrato Slack", type: "Compra", date: "2024-03-10", status: "vencido", folderId: "compra", valor: "R$ 2.500/mês", vencimento: "2024-09-10", parteContratante: "Slack Technologies" },
  { id: "3", name: "Proposta Cliente ABC", type: "Venda", date: "2024-06-01", status: "pendente", folderId: "venda", valor: "R$ 50.000", vencimento: "2024-12-01", parteContratante: "ABC Corp" },
  { id: "4", name: "SLA Fornecedor XYZ", type: "Compra", date: "2024-02-20", status: "ativo", folderId: "compra", valor: "R$ 8.000/mês", vencimento: "2025-02-20", parteContratante: "XYZ Ltda" },
];

export const mockUserAccess: UserAccess[] = [
  { id: "1", email: "patrickgigilas@yahoo.com.br", name: "Patrick Gigilas", folderId: "compra", role: "editar" },
  { id: "2", email: "patrickgigilas@yahoo.com.br", name: "Patrick Gigilas", folderId: "venda", role: "editar" },
];
