export interface Contract {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "ativo" | "vencido" | "pendente";
  folderId: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export const defaultFolders: Folder[] = [
  { id: "compra", name: "Contratos de Compra", parentId: null },
  { id: "venda", name: "Contratos de Venda", parentId: null },
];

export const mockContracts: Contract[] = [
  { id: "1", name: "Contrato AWS 2024", type: "Compra", date: "2024-01-15", status: "ativo", folderId: "compra" },
  { id: "2", name: "Contrato Slack", type: "Compra", date: "2024-03-10", status: "vencido", folderId: "compra" },
  { id: "3", name: "Proposta Cliente ABC", type: "Venda", date: "2024-06-01", status: "pendente", folderId: "venda" },
  { id: "4", name: "SLA Fornecedor XYZ", type: "Compra", date: "2024-02-20", status: "ativo", folderId: "compra" },
];
