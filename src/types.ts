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
  doctorHidden?: boolean;
  notified?: boolean;
  notifiedTime?: string;
  tags: string[];
  logs: string[];
  products?: CardProduct[];
}

export interface Customer {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  role: "Admin" | "Nhân viên";
}

export interface Brand {
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
  details?: {
    importPrice?: number;
    sellingPrice?: number;
    costPrice?: number;
    weight?: string;
    usage?: string;
    description?: string;
    strength?: string;
    daysToUse?: number;
  };
}

export interface AppData {
  cards: KanbanCard[];
  tagsConfig: Record<number, Tag[]>;
  customers?: Customer[];
  users?: UserAccount[];
  brands?: Brand[];
  productCategories?: ProductCategory[];
  products?: Product[];
}

export const TAB_NAMES: Record<number, string> = {
  0: "Nhắc lịch",
  1: "1. Tư vấn",
  2: "2. Gửi hàng",
  3: "3. Add/Dò",
  4: "4. Vấn đề",
  5: "5. Spa",
  6: "Xong",
  7: "6. Khám",
};

export const DEFAULT_TAGS: Record<number, Tag[]> = {
  1: [{ text: "Đang làm" }, { text: "Chờ rep" }],
  2: [{ text: "Đã gửi" }, { text: "Thiếu hàng" }],
  3: [{ text: "Đang add" }, { text: "Đang dò" }],
  4: [{ text: "Ưu tiên" }],
  5: [{ text: "Theo dõi" }, { text: "Xếp lịch" }],
  6: [],
  7: [{ text: "Theo dõi" }],
};
