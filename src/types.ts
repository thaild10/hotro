export interface CardLog {
  id: string;
  message: string;
  timestamp: string;
  user: string;
}

export interface Tag {
  text: string;
  color?: string;
}

export interface CardProduct {
  productId: string;
  tag: 'Dò' | 'Dò xong';
  date?: string;
  time?: string;
  updatedAt?: number;
}

export interface KanbanCard {
  id: string;
  tabId: number;
  name: string;
  note: string;
  doDate: string;
  startDate: string;
  doneDate?: string;
  collapsed?: boolean;
  doctorText?: string;
  doctorDate?: string;
  doctorReplies?: { text: string; date: string }[];
  doctorHidden?: boolean;
  notified?: boolean;
  notifiedTime?: string;
  replyAgain?: boolean;
  tags: string[];
  logs: string[];
  products?: CardProduct[];
  images?: string[];
}

export interface CustomerGroup {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  imageUrl?: string;
  groupId?: string;
  city?: string;
  district?: string;
  address?: string;
  initialDebt?: number;
  skinIssues?: string[];
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  pinCode?: string;
  role: "Admin" | "Nhân viên";
}

export interface Brand {
  id: string;
  name: string;
}

export interface SkinIssue {
  id: string;
  name: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  price?: number;
  imageUrl?: string;
  details?: {
    importPrice?: number;
    sellingPrice?: number;
    costPrice?: number;
    weight?: string;
    usage?: string;
    description?: string;
    strength?: string;
    daysToUse?: number;
    mfgDate?: string;
    expDate?: string;
  };
}

export interface SkinAuditEntry {
  id: string;
  customerId: string;
  month: string; // "YYYY-MM"
  type: 'Khám' | 'Kiểm tra';
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface SkinAuditLog {
  id: string;
  customerId: string;
  action: 'create' | 'update' | 'delete';
  type: 'Khám' | 'Kiểm tra';
  month: string;
  date: string;
  user: string;
  timestamp: string;
}

export interface LedgerAccount {
  id: string;
  name: string;
  accountNumber: string;
}

export interface LedgerPurpose {
  id: string;
  name: string;
  type: 'Thu' | 'Chi';
}

export interface LedgerTransaction {
  id: string;
  accountId: string;
  purposeId: string;
  amount: number;
  date: string;
  reason: string;
  type: 'Thu' | 'Chi';
  createdAt: number;
  customerId?: string; // If purpose is "Khách"
}

export interface LedgerLog {
  id: string;
  timestamp: string;
  user: string;
  action: string; // "Tạo", "Sửa", "Xóa"
  targetType: 'Tài khoản' | 'Mục đích' | 'Phiếu Thu' | 'Phiếu Chi' | 'Giao dịch';
  message: string;
}

export interface ImageCompressionSettings {
  maxWidth: number;
  quality: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  accountNumber?: string;
  imageUrl?: string;
}

export interface ImportItem {
  productId: string;
  quantity: number;
  importPrice: number;
  subtotal: number;
}

export interface ImportOrder {
  id: string;
  supplierId: string;
  items: ImportItem[];
  totalAmount: number;
  date: string;
  createdAt: number;
  transactionId?: string; // Linked "Chi" transaction
}

export interface AppData {
  cards: KanbanCard[];
  tagsConfig: Record<number, Tag[]>;
  customers?: Customer[];
  customerGroups?: CustomerGroup[];
  users?: UserAccount[];
  brands?: Brand[];
  skinIssues?: SkinIssue[];
  productCategories?: ProductCategory[];
  products?: Product[];
  skinAudits?: SkinAuditEntry[];
  skinAuditLogs?: SkinAuditLog[];
  compressionSettings?: ImageCompressionSettings;
  ledgerAccounts?: LedgerAccount[];
  ledgerPurposes?: LedgerPurpose[];
  ledgerTransactions?: LedgerTransaction[];
  ledgerLogs?: LedgerLog[];
  orders?: Order[];
  suppliers?: Supplier[];
  importOrders?: ImportOrder[];
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  mfgDate?: string;
  expDate?: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  date: string;
  createdAt: number;
  city?: string;
  district?: string;
  address?: string;
  transactionId?: string; // Linked "Chi" transaction
}

export const TAB_NAMES: Record<number, string> = {
  0: "Nhắc lịch",
  1: "1. Tư vấn",
  2: "2. Gửi hàng",
  3: "3. Add/Dò",
  4: "4. Vấn đề",
  5: "5. Spa",
  6: "6. Khám",
  7: "Xong",
};

export const DEFAULT_TAGS: Record<number, Tag[]> = {
  1: [{ text: "Đang làm" }, { text: "Chờ rep" }],
  2: [{ text: "Đã gửi" }, { text: "Thiếu hàng" }],
  3: [{ text: "Đang add" }, { text: "Đang dò" }],
  4: [{ text: "Ưu tiên" }],
  5: [{ text: "Theo dõi" }, { text: "Xếp lịch" }],
  6: [{ text: "Theo dõi" }],
  7: [],
};
