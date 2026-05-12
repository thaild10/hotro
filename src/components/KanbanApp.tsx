import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Plus, 
  Search, 
  LogOut, 
  Cloud, 
  CloudUpload, 
  CloudOff, 
  Tag as TagIcon, 
  Settings2,
  Clock,
  X,
  Users,
  Shield,
  Package,
  Smartphone,
  Stethoscope,
  Wallet,
  MoreVertical,
  ChevronLeft,
  ShoppingCart,
  Building,
  Home,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  cn, 
  getTodayFormatted, 
  getTimeFormatted, 
  parseDateString 
} from "../lib/utils";
import { 
  AppData, 
  KanbanCard, 
  TAB_NAMES, 
  Tag,
  DEFAULT_TAGS,
  Customer,
  CustomerGroup,
  UserAccount,
  Brand,
  ProductCategory,
  Product,
  SkinAuditEntry,
  SkinAuditLog,
  ImageCompressionSettings,
  LedgerAccount,
  LedgerPurpose,
  LedgerTransaction,
  LedgerLog,
  Order,
  Supplier,
  ImportOrder
} from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import Card from "./Card";
import CardEditModal from "./Modals/CardEditModal";
import TagManagementModal from "./Modals/TagManagementModal";
import CustomerManagementModal from "./Modals/CustomerManagementModal";
import AccountManagementModal from "./Modals/AccountManagementModal";
import ProductManagementModal from "./Modals/ProductManagementModal";
import CardHistoryModal from "./Modals/CardHistoryModal";
import TagSelectionModal from "./Modals/TagSelectionModal";
import NoteEditModal from "./Modals/NoteEditModal";
import DoctorReplyModal from "./Modals/DoctorReplyModal";
import AddDoModal from "./Modals/AddDoModal";
import SkinAuditModal from "./Modals/SkinAuditModal";
import ImageCompressionModal from "./Modals/ImageCompressionModal";
import OrderManagementModal from "./Modals/OrderManagementModal";
import SupplierManagementModal from "./Modals/SupplierManagementModal";
import ImportManagementModal from "./Modals/ImportManagementModal";
import { ConfirmDialog } from "./Modals/ConfirmDialog";
import LedgerModal from "./Modals/LedgerModal";

interface KanbanAppProps {
  username: string;
  initialData: AppData;
  onLogout: () => void;
}

export default function KanbanApp({ username, initialData, onLogout }: KanbanAppProps) {
  const [cards, setCards] = useState<KanbanCard[]>(initialData.cards || []);
  const [tagsConfig, setTagsConfig] = useState<Record<number, Tag[]>>(initialData.tagsConfig || DEFAULT_TAGS);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers || []);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>(initialData.customerGroups || []);
  const [users, setUsers] = useState<UserAccount[]>(initialData.users || []);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "offline">("saved");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // Auto-detect device
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    setDeviceView(isMobile ? "mobile" : "desktop");

    // Auto-expand/collapse cards on initialization
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    setCards(prev => prev.map(card => {
      const doDate = parseDateString(card.doDate);
      // If doDate is today or past, expand. Otherwise, collapse.
      return { ...card, collapsed: doDate > now };
    }));
  }, []);

  // Determine user role
  const currentUserRole = users.find(u => {
    const stored = u.username.toLowerCase().trim();
    const current = username.toLowerCase().trim();
    
    // Exact match
    if (stored === current) return true;
    
    // If one has domain and other doesn't
    const storedPrefix = stored.split('@')[0];
    const currentPrefix = current.split('@')[0];
    if (storedPrefix === currentPrefix) return true;

    return false;
  })?.role || "Admin";

  // Modal states
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [tagModalCardId, setTagModalCardId] = useState<string | null>(null);
  const [historyCardId, setHistoryCardId] = useState<string | null>(null);
  const [noteEditCardId, setNoteEditCardId] = useState<string | null>(null);
  const [doctorReplyCardId, setDoctorReplyCardId] = useState<string | null>(null);
  const [addDoCardId, setAddDoCardId] = useState<string | null>(null);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);

  const prevCardsRef = useRef(cards);
  const prevTagsRef = useRef(tagsConfig);
  const prevCustomersRef = useRef(customers);
  const prevUsersRef = useRef(users);

  const [brands, setBrands] = useState<Brand[]>(initialData.brands || []);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(initialData.productCategories || []);
  const [products, setProducts] = useState<Product[]>(initialData.products || []);
  const [showProductManagement, setShowProductManagement] = useState(false);
  const [skinAudits, setSkinAudits] = useState<SkinAuditEntry[]>(initialData.skinAudits || []);
  const [skinAuditLogs, setSkinAuditLogs] = useState<SkinAuditLog[]>(initialData.skinAuditLogs || []);
  const [compressionSettings, setCompressionSettings] = useState<ImageCompressionSettings>(
    initialData.compressionSettings || { maxWidth: 1200, quality: 80 }
  );
  const [showSkinAudit, setShowSkinAudit] = useState(false);
  const [showCompressionSettings, setShowCompressionSettings] = useState(false);
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);

  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>(initialData.ledgerAccounts || []);
  const [ledgerPurposes, setLedgerPurposes] = useState<LedgerPurpose[]>(() => {
    const saved = initialData.ledgerPurposes || [];
    const defaults = [
      { id: 'p-khach', name: 'Khách', type: 'Thu' as const },
      { id: 'p-chinh-so-du', name: 'Chỉnh số dư', type: 'Thu' as const }
    ];

    let final = [...saved];
    // Remove old names and replace with merged ones to ensure IDs are correct
    final = final.filter(p => !['Khách', 'Chỉnh số dư'].includes(p.name));
    
    defaults.forEach(d => {
      if (!final.find(p => p.name === d.name)) {
        final.push(d);
      }
    });

    return final;
  });

  const getAugmentedPurposes = (purps: LedgerPurpose[]) => {
    const defaults = [
      { id: 'p-khach', name: 'Khách', type: 'Thu' as const },
      { id: 'p-chinh-so-du', name: 'Chỉnh số dư', type: 'Thu' as const }
    ];
    let final = [...(purps || [])];
    final = final.filter(p => !['Khách', 'Chỉnh số dư'].includes(p.name));
    defaults.forEach(d => {
      if (!final.find(p => p.name === d.name)) {
        final.push(d);
      }
    });
    return final;
  };
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>(initialData.ledgerTransactions || []);
  const [ledgerLogs, setLedgerLogs] = useState<LedgerLog[]>(initialData.ledgerLogs || []);
  const [orders, setOrders] = useState<Order[]>(initialData.orders || []);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialData.suppliers || []);
  const [importOrders, setImportOrders] = useState<ImportOrder[]>(initialData.importOrders || []);
  const [showLedger, setShowLedger] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [currentView, setCurrentView] = useState<'kanban' | 'ledger' | 'orders' | 'suppliers' | 'imports'>('kanban');
  const [debtHistoryCustomerId, setDebtHistoryCustomerId] = useState<string | null>(null);

  const prevBrandsRef = useRef(brands);
  const prevProductCategoriesRef = useRef(productCategories);
  const prevProductsRef = useRef(products);
  const prevSkinAuditsRef = useRef(skinAudits);

  // Update local state when incoming data changes (remote updates)
  useEffect(() => {
    const serverCards = initialData.cards || [];
    const serverTags = initialData.tagsConfig || DEFAULT_TAGS;
    const serverUsers = initialData.users || [];
    const serverBrands = initialData.brands || [];
    const serverProductCategories = initialData.productCategories || [];
    const serverProducts = initialData.products || [];
    const serverCustomerGroups = initialData.customerGroups || [];
    const serverSkinAudits = initialData.skinAudits || [];
    const serverSkinAuditLogs = initialData.skinAuditLogs || [];
    const serverCompressionSettings = initialData.compressionSettings || { maxWidth: 1200, quality: 80 };

    if (saveStatus === "saved") {
      const cardsMatch = JSON.stringify(serverCards) === JSON.stringify(cards);
      const tagsMatch = JSON.stringify(serverTags) === JSON.stringify(tagsConfig);
      const serverCustomers = initialData.customers || [];
      const customersMatch = JSON.stringify(serverCustomers) === JSON.stringify(customers);
      const usersMatch = JSON.stringify(serverUsers) === JSON.stringify(users);
      const brandsMatch = JSON.stringify(serverBrands) === JSON.stringify(brands);
      const categoriesMatch = JSON.stringify(serverProductCategories) === JSON.stringify(productCategories);
      const productsMatch = JSON.stringify(serverProducts) === JSON.stringify(products);
      const groupsMatch = JSON.stringify(serverCustomerGroups) === JSON.stringify(customerGroups);
      const skinAuditsMatch = JSON.stringify(serverSkinAudits) === JSON.stringify(skinAudits);
      const skinAuditLogsMatch = JSON.stringify(serverSkinAuditLogs) === JSON.stringify(skinAuditLogs);
      const compressionSettingsMatch = JSON.stringify(serverCompressionSettings) === JSON.stringify(compressionSettings);
      
      const serverLedgerAccounts = initialData.ledgerAccounts || [];
      const serverLedgerPurposes = getAugmentedPurposes(initialData.ledgerPurposes || []);
      const serverLedgerTransactions = initialData.ledgerTransactions || [];
      const serverLedgerLogs = initialData.ledgerLogs || [];
      const serverOrders = initialData.orders || [];
      const serverSuppliers = initialData.suppliers || [];
      const serverImportOrders = initialData.importOrders || [];

      const ledgerAccountsMatch = JSON.stringify(serverLedgerAccounts) === JSON.stringify(ledgerAccounts);
      const ledgerPurposesMatch = JSON.stringify(serverLedgerPurposes) === JSON.stringify(ledgerPurposes);
      const ledgerTransactionsMatch = JSON.stringify(serverLedgerTransactions) === JSON.stringify(ledgerTransactions);
      const ledgerLogsMatch = JSON.stringify(serverLedgerLogs) === JSON.stringify(ledgerLogs);
      const ordersMatch = JSON.stringify(serverOrders) === JSON.stringify(orders);
      const suppliersMatch = JSON.stringify(serverSuppliers) === JSON.stringify(suppliers);
      const importOrdersMatch = JSON.stringify(serverImportOrders) === JSON.stringify(importOrders);

      if (!cardsMatch) {
        const today = parseDateString(getTodayFormatted()).getTime();
        const processedCards = serverCards.map(c => {
          const cardDate = c.doDate ? parseDateString(c.doDate).getTime() : null;
          const isTodayOrOverdue = cardDate !== null && cardDate <= today;
          // Apply collapse logic: open if today/overdue, else follow default/stored
          // Actually user says "mặc định đóng. Trừ khi... thì mở"
          return { ...c, collapsed: isTodayOrOverdue ? false : true };
        });
        setCards(processedCards);
        prevCardsRef.current = serverCards;
      }
      if (!tagsMatch) {
        setTagsConfig(serverTags);
        prevTagsRef.current = serverTags;
      }
      if (!customersMatch) {
        setCustomers(serverCustomers);
        prevCustomersRef.current = serverCustomers;
      }
      if (!usersMatch) {
        setUsers(serverUsers);
        prevUsersRef.current = serverUsers;
      }
      if (!brandsMatch) {
        setBrands(serverBrands);
        prevBrandsRef.current = serverBrands;
      }
      if (!categoriesMatch) {
        setProductCategories(serverProductCategories);
        prevProductCategoriesRef.current = serverProductCategories;
      }
      if (!productsMatch) {
        setProducts(serverProducts);
        prevProductsRef.current = serverProducts;
      }
      if (!groupsMatch) {
        setCustomerGroups(serverCustomerGroups);
      }
      if (!skinAuditsMatch) {
        setSkinAudits(serverSkinAudits);
        prevSkinAuditsRef.current = serverSkinAudits;
      }
      if (!skinAuditLogsMatch) {
        setSkinAuditLogs(serverSkinAuditLogs);
      }
      if (!compressionSettingsMatch) {
        setCompressionSettings(serverCompressionSettings);
      }
      if (!ledgerAccountsMatch) {
        setLedgerAccounts(serverLedgerAccounts);
      }
      if (!ledgerPurposesMatch) {
        setLedgerPurposes(serverLedgerPurposes);
      }
      if (!ledgerTransactionsMatch) {
        setLedgerTransactions(serverLedgerTransactions);
      }
      if (!ledgerLogsMatch) {
        setLedgerLogs(serverLedgerLogs);
      }
      if (!ordersMatch) {
        setOrders(serverOrders);
      }
      if (!suppliersMatch) {
        setSuppliers(serverSuppliers);
      }
      if (!importOrdersMatch) {
        setImportOrders(serverImportOrders);
      }
    }
  }, [initialData, saveStatus]);

  // Sync with Firestore
  useEffect(() => {
    const cardsChanged = JSON.stringify(prevCardsRef.current) !== JSON.stringify(cards);
    const tagsChanged = JSON.stringify(prevTagsRef.current) !== JSON.stringify(tagsConfig);
    const customersChanged = JSON.stringify(prevCustomersRef.current) !== JSON.stringify(customers);
    const usersChanged = JSON.stringify(prevUsersRef.current) !== JSON.stringify(users);
    const brandsChanged = JSON.stringify(prevBrandsRef.current) !== JSON.stringify(brands);
    const categoriesChanged = JSON.stringify(prevProductCategoriesRef.current) !== JSON.stringify(productCategories);
    const productsChanged = JSON.stringify(prevProductsRef.current) !== JSON.stringify(products);
    const groupsChanged = JSON.stringify(initialData.customerGroups || []) !== JSON.stringify(customerGroups);
    const skinAuditsChanged = JSON.stringify(prevSkinAuditsRef.current) !== JSON.stringify(skinAudits);
    const skinAuditLogsChanged = JSON.stringify(initialData.skinAuditLogs) !== JSON.stringify(skinAuditLogs);
    const compressionSettingsChanged = JSON.stringify(initialData.compressionSettings) !== JSON.stringify(compressionSettings);
    const ledgerChanged = 
      JSON.stringify(initialData.ledgerAccounts || []) !== JSON.stringify(ledgerAccounts) ||
      JSON.stringify(initialData.ledgerPurposes || []) !== JSON.stringify(ledgerPurposes) ||
      JSON.stringify(initialData.ledgerTransactions || []) !== JSON.stringify(ledgerTransactions) ||
      JSON.stringify(initialData.ledgerLogs || []) !== JSON.stringify(ledgerLogs) ||
      JSON.stringify(initialData.orders || []) !== JSON.stringify(orders) ||
      JSON.stringify(initialData.suppliers || []) !== JSON.stringify(suppliers) ||
      JSON.stringify(initialData.importOrders || []) !== JSON.stringify(importOrders);

    const shouldSave = cardsChanged || tagsChanged || customersChanged || usersChanged || brandsChanged || categoriesChanged || productsChanged || skinAuditsChanged || skinAuditLogsChanged || compressionSettingsChanged || ledgerChanged || groupsChanged;

    if (shouldSave) {
      const performSave = async () => {
        setSaveStatus("saving");
        try {
          const docRef = doc(db, "appdata", "shared_kanban");
          
          // Deep sanitize utility to handle any undefined values
          const sanitize = (val: any): any => {
            if (val === undefined) return null;
            if (val === null) return null;
            if (Array.isArray(val)) return val.map(sanitize);
            if (typeof val === 'object') {
              const cleaned: any = {};
              for (const key in val) {
                cleaned[key] = sanitize(val[key]);
              }
              return cleaned;
            }
            return val;
          };

          await setDoc(docRef, sanitize({ 
            cards: cards.map(c => ({
              ...c,
              doneDate: c.doneDate || null,
              collapsed: !!c.collapsed,
              doctorText: c.doctorText || "",
              doctorDate: c.doctorDate || "",
              doctorHidden: !!c.doctorHidden,
              notified: !!c.notified,
              notifiedTime: c.notifiedTime || "",
              products: c.products || []
            })), 
            tagsConfig,
            customers,
            users,
            brands,
            productCategories,
            products,
            customerGroups,
            skinAudits,
            skinAuditLogs,
            compressionSettings,
            ledgerAccounts,
            ledgerPurposes,
            ledgerTransactions,
            ledgerLogs,
            orders,
            suppliers,
            importOrders
          }));
          setSaveStatus("saved");
          prevCardsRef.current = cards;
          prevTagsRef.current = tagsConfig;
          prevCustomersRef.current = customers;
          prevUsersRef.current = users;
          prevBrandsRef.current = brands;
          prevProductCategoriesRef.current = productCategories;
          prevProductsRef.current = products;
          prevSkinAuditsRef.current = skinAudits;
        } catch (error) {
          console.error("Save error:", error);
          setSaveStatus("error");
        }
      };

      const timer = setTimeout(performSave, 2000); 
      return () => clearTimeout(timer);
    }
  }, [initialData, cards, tagsConfig, customers, users, brands, productCategories, products, skinAudits, skinAuditLogs, compressionSettings, customerGroups, ledgerAccounts, ledgerPurposes, ledgerTransactions, ledgerLogs, orders]);

  const handleCreateCard = () => {
    setIsCreatingCard(true);
    if (activeTab === 0) setActiveTab(1);
  };

  const createCardConfirmed = (updates: Partial<KanbanCard>) => {
    const targetTabId = activeTab === 0 ? 1 : activeTab;
    const actionName = TAB_NAMES[targetTabId];
    const log = `${username} - Tạo thẻ mới tại ${actionName} - ${getTimeFormatted()}`;
    
    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tabId: targetTabId,
      name: updates.name || "MỚI",
      note: updates.note || "",
      doDate: updates.doDate || "",
      startDate: getTodayFormatted(),
      tags: updates.tags || [],
      logs: [log],
      collapsed: false,
      doctorText: "",
      doctorDate: "",
      doctorHidden: false,
      notified: false,
      notifiedTime: "",
      doneDate: "",
      images: updates.images || []
    };
    
    setCards(prev => [newCard, ...prev]);
    setIsCreatingCard(false);
  };

  const updateCard = (cardId: string, updates: Partial<KanbanCard>) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      
      const nextCard = { ...c, ...updates };
      
      // If doDate changed, re-evaluate collapse logic
      if (updates.doDate !== undefined) {
        const today = parseDateString(getTodayFormatted()).getTime();
        const cardDate = nextCard.doDate ? parseDateString(nextCard.doDate).getTime() : null;
        const isTodayOrOverdue = cardDate !== null && cardDate <= today;
        nextCard.collapsed = !isTodayOrOverdue;
      }
      
      return nextCard;
    }));
  };

  const confirmAction = (message: string, action: () => void) => {
    setConfirmConfig({ 
      message, 
      action: () => {
        action();
        setConfirmConfig(null);
      } 
    });
  };

  const moveCard = (cardId: string, targetTabId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    confirmAction(`Bạn có chắc chắn muốn chuyển thẻ này sang ${TAB_NAMES[targetTabId]}?`, () => {
      const actionName = TAB_NAMES[targetTabId];
      const log = `${username} - Chuyển sang ${actionName} - ${getTimeFormatted()}`;

      setCards(prev => prev.map(c => {
        if (c.id !== cardId) return c;
        
        let updates: Partial<KanbanCard> = { 
          tabId: targetTabId,
          logs: [log, ...c.logs]
        };
        
        const today = parseDateString(getTodayFormatted()).getTime();
        const cardDate = c.doDate ? parseDateString(c.doDate).getTime() : null;
        const isTodayOrOverdue = cardDate !== null && cardDate <= today;

        if (targetTabId === 7) {
          updates.doneDate = getTodayFormatted();
        } 
        
        updates.collapsed = !isTodayOrOverdue;
        
        return { ...c, ...updates };
      }));
    });
  };

  const moveBackFromXong = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    confirmAction("Bạn có chắc chắn muốn quay lại bước trước?", () => {
      setCards(prev => prev.map(c => {
        if (c.id !== cardId) return c;

        const moveLogs = c.logs.filter(l => l.includes("Chuyển sang"));
        const prevMoveLog = moveLogs[1];
        
        let prevTabId = 1; // Default back to Tư vấn if no history
        if (prevMoveLog) {
          for (const [id, name] of Object.entries(TAB_NAMES)) {
            if (prevMoveLog.includes(`Chuyển sang ${name}`) || prevMoveLog.includes(`Chuyển sang ${id}.`)) {
              prevTabId = parseInt(id);
              break;
            }
          }
        }

        const today = parseDateString(getTodayFormatted()).getTime();
        const cardDate = c.doDate ? parseDateString(c.doDate).getTime() : null;
        const isTodayOrOverdue = cardDate !== null && cardDate <= today;

        // Remove only the latest "Chuyển sang Xong" log
        let removed = false;
        const newLogs = c.logs.filter(l => {
          if (!removed && (l.includes(`Chuyển sang ${TAB_NAMES[7]}`) || l.includes("Chuyển sang 7. Xong"))) {
            removed = true;
            return false;
          }
          return true;
        });
        
        return { 
          ...c, 
          tabId: prevTabId, 
          collapsed: !isTodayOrOverdue,
          doneDate: "",
          logs: newLogs
        };
      }));
    });
  };

  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  const addLog = (cardId: string, action: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const log = `${username} - ${action} - ${getTimeFormatted()}`;
    updateCard(cardId, { logs: [log, ...card.logs] });
  };

  const overdueCards = useMemo(() => {
    const today = parseDateString(getTodayFormatted()).getTime();
    return cards.filter(c => c.tabId !== 7 && c.doDate && parseDateString(c.doDate).getTime() <= today);
  }, [cards]);

  const filteredCards = useMemo(() => {
    let list = cards;
    
    if (searchQuery) {
      // If there's a search query, search across ALL cards
      return cards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          const dateA = parseDateString(a.doDate);
          const dateB = parseDateString(b.doDate);
          return dateA.getTime() - dateB.getTime();
        });
    }

    if (activeTab === 0) {
      list = overdueCards;
    } else {
      list = cards.filter(c => c.tabId === activeTab);
    }

    // Sort by startDate descending (latest first)
    return [...list].sort((a, b) => {
      const dateA = parseDateString(a.startDate || a.doDate);
      const dateB = parseDateString(b.startDate || b.doDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [cards, activeTab, searchQuery, overdueCards]);

  const addCardLogByCustomer = (customerName: string, action: string) => {
    const card = cards.find(c => c.name.toLowerCase() === customerName.toLowerCase() && c.tabId !== 7);
    if (card) {
      addLog(card.id, action);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-[100dvh] overflow-hidden bg-pastel-bg transition-all duration-300 ease-in-out relative",
      deviceView === 'mobile' ? "max-w-[430px] mx-auto border-x border-slate-200 shadow-2xl" : "w-full"
    )}>
      {/* Search Header Logic adjustment */}
      <header className="bg-white/80 backdrop-blur-md px-3 py-3 border-b border-rose-100 shrink-0 shadow-sm flex items-center justify-between gap-3 sticky top-0 z-[1500]">
        <div className="flex-1 relative max-w-md">
          {currentView === 'kanban' ? (
            <>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 w-5 h-5" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-rose-50/50 border border-rose-100/50 rounded-2xl py-3 pl-12 pr-12 text-base font-bold text-slate-700 placeholder:text-rose-200 focus:bg-white focus:ring-4 focus:ring-rose-500/5 outline-none transition-all shadow-inner" 
                placeholder="Tìm tên khách..."
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-500 p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentView('kanban')}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center justify-center active:scale-95 shadow-sm"
                title="Quay lại"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                {currentView === 'ledger' && "Thu Chi"}
                {currentView === 'orders' && "Đơn hàng"}
                {currentView === 'suppliers' && "Nhà cung cấp"}
                {currentView === 'imports' && "Nhập hàng"}
              </h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 md:max-w-none">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x py-1 px-1 max-w-[120px] xs:max-w-[160px] sm:max-w-none">
            <div className={cn(
              "flex items-center justify-center min-w-[40px] w-10 h-10 rounded-xl transition-all shrink-0 shadow-sm snap-center",
              saveStatus === "saving" && "bg-amber-50 text-amber-500 border border-amber-100",
              saveStatus === "saved" && "bg-emerald-50 text-emerald-500 border border-emerald-100",
              (saveStatus === "error" || saveStatus === "offline") && "bg-rose-50 text-rose-500 border border-rose-100"
            )} title="Trạng thái lưu">
              {saveStatus === "saving" && <CloudUpload className="w-5 h-5" />}
              {saveStatus === "saved" && <Cloud className="w-5 h-5" />}
              {(saveStatus === "error" || saveStatus === "offline") && <CloudOff className="w-5 h-5" />}
            </div>

            <button 
              onClick={() => setShowSkinAudit(true)}
              className="flex items-center justify-center min-w-[40px] w-10 h-10 rounded-xl bg-amber-50 text-amber-500 border border-amber-100 active:scale-95 transition-all shadow-sm snap-center"
              title="Khám da"
            >
              <Stethoscope className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setCurrentView('orders')}
              className={cn(
                "flex items-center justify-center min-w-[40px] w-10 h-10 rounded-xl border active:scale-95 transition-all shadow-sm snap-center",
                currentView === 'orders' ? "bg-rose-500 text-white border-rose-600/10" : "bg-rose-50 text-rose-500 border-rose-100"
              )}
              title="Tạo đơn"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setShowCustomerManagement(true)}
              className="flex items-center justify-center min-w-[40px] w-10 h-10 rounded-xl bg-violet-50 text-violet-500 border border-violet-100 active:scale-95 transition-all shadow-sm snap-center"
              title="Khách hàng"
            >
              <Users className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setCurrentView('ledger')}
              className={cn(
                "flex items-center justify-center min-w-[40px] w-10 h-10 rounded-xl border active:scale-95 transition-all shadow-sm snap-center",
                currentView === 'ledger' ? "bg-emerald-500 text-white border-emerald-600" : "bg-emerald-50 text-emerald-500 border-emerald-100"
              )}
              title="Thu Chi"
            >
              <Wallet className="w-5 h-5" />
            </button>
          </div>

          <div className="relative shrink-0 group">
            <button 
              onClick={() => setShowFeaturesMenu(prev => !prev)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border shadow-sm",
                showFeaturesMenu 
                  ? "bg-slate-800 text-white border-slate-900" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-500"
              )}
              title="Thêm tính năng"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showFeaturesMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[1600]" 
                  onClick={() => setShowFeaturesMenu(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute top-full mt-3 right-0 bg-white border border-rose-100 rounded-3xl z-[1700] min-w-[220px] max-h-[80vh] overflow-y-auto p-2 flex flex-col gap-1 no-scrollbar border-b-4 border-rose-200"
                >
                  <div className="px-4 py-2 mb-1">
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">Sản phẩm & Đối tác</span>
                  </div>

                  {currentUserRole === 'Admin' && (
                    <>
                      <button 
                        onClick={() => { setShowProductManagement(true); setShowFeaturesMenu(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center transition-colors group-hover:bg-white text-amber-500">
                          <Package className="w-4 h-4" />
                        </div>
                        Quản lý sản phẩm
                      </button>

                      <button 
                        onClick={() => { setCurrentView('suppliers'); setShowFeaturesMenu(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center transition-colors group-hover:bg-white text-orange-500">
                          <Building className="w-4 h-4" />
                        </div>
                        Quản lý nhà cung cấp
                      </button>

                      <button 
                        onClick={() => { setCurrentView('imports'); setShowFeaturesMenu(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-white text-blue-500">
                          <Plus className="w-4 h-4" />
                        </div>
                        Nhập hàng mới
                      </button>
                      <div className="h-px bg-rose-50 mx-2 mb-1 mt-1" />
                    </>
                  )}

                  <div className="px-4 py-2 mb-1">
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">Cấu hình hệ thống</span>
                  </div>

                  {currentUserRole === 'Admin' && (
                    <button 
                      onClick={() => { setShowAccountManagement(true); setShowFeaturesMenu(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center transition-colors group-hover:bg-white text-indigo-500">
                        <Shield className="w-4 h-4" />
                      </div>
                      Quản lý tài khoản
                    </button>
                  )}

                  <button 
                    onClick={() => { setShowTagManagement(true); setShowFeaturesMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center transition-colors group-hover:bg-white text-rose-400">
                      <TagIcon className="w-4 h-4" />
                    </div>
                    Cấu hình các Tag
                  </button>

                  <button 
                    onClick={() => { setShowCompressionSettings(true); setShowFeaturesMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center transition-colors group-hover:bg-white text-rose-400">
                      <CloudUpload className="w-4 h-4" />
                    </div>
                    Cài đặt nén ảnh
                  </button>

                  <div className="h-px bg-rose-50 mx-2 mb-1 mt-1" />
                  
                  <div className="px-4 py-2 mb-1">
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">Hiển thị</span>
                  </div>

                  <button 
                    onClick={() => { setDeviceView(prev => prev === 'desktop' ? 'mobile' : 'desktop'); setShowFeaturesMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-slate-700 rounded-2xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center transition-colors group-hover:bg-white">
                      {deviceView === 'desktop' ? <Smartphone className="w-4 h-4 text-slate-500" /> : <Monitor className="w-4 h-4 text-rose-400" />}
                    </div>
                    {deviceView === 'desktop' ? 'Chế độ Mobile' : 'Chế độ Desktop'}
                  </button>

                  <div className="h-px bg-rose-50 mx-2 mb-1 mt-1" />
                  <button 
                    onClick={() => confirmAction("Bạn có chắc chắn muốn đăng xuất?", onLogout)}
                    className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center gap-3 text-sm font-bold text-rose-500 rounded-2xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center transition-colors group-hover:bg-white text-rose-400">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Đăng xuất
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      {currentView === 'kanban' && (
        <nav className="bg-white/50 backdrop-blur-sm border-b border-rose-100 shrink-0 overflow-x-auto no-scrollbar touch-pan-x sticky top-[65px] z-[1000]">
          <div className="flex px-3 py-3 gap-5 whitespace-nowrap min-w-max items-center h-[52px]">
            {Object.entries(TAB_NAMES).map(([id, name]) => {
              const tabId = parseInt(id);
              const isActive = activeTab === tabId;
              return (
                <button 
                  key={id}
                  onClick={() => setActiveTab(tabId)}
                  className={cn(
                    "relative text-sm font-bold px-3 py-1.5 transition-all rounded-xl",
                    isActive 
                      ? "text-rose-600 bg-rose-50" 
                      : "text-slate-400 hover:text-rose-400 hover:bg-rose-50/30"
                  )}
                >
                  {name}
                  {tabId === 0 && (
                    <span className={cn(
                      "ml-1.5 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-lg font-black",
                      isActive ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-500"
                    )}>
                      {overdueCards.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'kanban' ? (
          <>
            <main className="flex-1 overflow-y-auto p-4 pb-32 space-y-4 no-scrollbar">
              {filteredCards.length > 0 ? (
                filteredCards.map((card, index) => (
                  <Card 
                    key={card.id}
                    card={card}
                    customers={customers}
                    products={products}
                    brands={brands}
                    index={index}
                    onEdit={() => setEditingCardId(card.id)}
                    onMove={(tid) => moveCard(card.id, tid)}
                    onMoveBack={() => moveBackFromXong(card.id)}
                    onTagEdit={() => setTagModalCardId(card.id)}
                    onHistory={() => setHistoryCardId(card.id)}
                    onNoteEdit={() => setNoteEditCardId(card.id)}
                    onDoctorReply={() => setDoctorReplyCardId(card.id)}
                    onNotify={() => {
                      confirmAction("Báo khách?", () => addLog(card.id, "Báo khách"));
                    }}
                    onAddDo={() => setAddDoCardId(card.id)}
                    updateCard={updateCard}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-pastel-subtext italic">
                  <span className="text-sm">Không có dữ liệu</span>
                </div>
              )}
            </main>

            {/* Footer Action */}
            <div className="p-6 shrink-0 bg-transparent pb-[calc(1.5rem+env(safe-area-inset-bottom))] sticky bottom-0 z-[1200] pointer-events-none">
              <button 
                onClick={handleCreateCard}
                className="w-full bg-rose-400 hover:bg-rose-500 py-4.5 rounded-2xl text-white font-black text-lg shadow-2xl shadow-rose-200/50 flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[64px] pointer-events-auto"
              >
                <Plus className="w-7 h-7 stroke-[3]" /> Tạo thẻ mới
              </button>
            </div>
          </>
        ) : currentView === 'ledger' ? (
          <LedgerModal 
            accounts={ledgerAccounts}
            purposes={ledgerPurposes}
            transactions={ledgerTransactions}
            logs={ledgerLogs}
            customers={customers}
            username={username}
            userPassword={users.find(u => {
              const stored = u.username.toLowerCase().trim();
              const current = username.toLowerCase().trim();
              
              if (stored === current) return true;
              
              const storedPrefix = stored.split('@')[0];
              const currentPrefix = current.split('@')[0];
              if (storedPrefix === currentPrefix) return true;

              return false;
            })?.password}
            onUpdateAccounts={setLedgerAccounts}
            onUpdatePurposes={setLedgerPurposes}
            onUpdateTransactions={setLedgerTransactions}
            onUpdateLogs={setLedgerLogs}
            onClose={() => {
              setCurrentView('kanban');
              setDebtHistoryCustomerId(null);
            }}
            onAddCardLog={addCardLogByCustomer}
            deviceView={deviceView}
            isPage={true}
            initialCustomerDebtId={debtHistoryCustomerId}
          />
        ) : currentView === 'orders' ? (
          <OrderManagementModal 
            orders={orders}
            customers={customers}
            products={products}
            onUpdateOrders={setOrders}
            onUpdateTransactions={setLedgerTransactions}
            ledgerTransactions={ledgerTransactions}
            ledgerPurposes={ledgerPurposes}
            ledgerAccounts={ledgerAccounts}
            onUpdateCustomers={setCustomers}
            customerGroups={customerGroups}
            onUpdateGroups={setCustomerGroups}
            onViewDebtHistory={(id) => {
              setDebtHistoryCustomerId(id);
              setCurrentView('ledger');
            }}
            onAddCardLog={addCardLogByCustomer}
            compressionSettings={compressionSettings}
            onClose={() => setCurrentView('kanban')}
            deviceView={deviceView}
            isPage={true}
          />
        ) : currentView === 'suppliers' ? (
          <SupplierManagementModal 
            suppliers={suppliers}
            onUpdateSuppliers={setSuppliers}
            onClose={() => setCurrentView('kanban')}
            deviceView={deviceView}
            compressionSettings={compressionSettings}
          />
        ) : currentView === 'imports' ? (
          <ImportManagementModal 
            importOrders={importOrders}
            suppliers={suppliers}
            products={products}
            ledgerTransactions={ledgerTransactions}
            ledgerPurposes={ledgerPurposes}
            ledgerAccounts={ledgerAccounts}
            onUpdateImportOrders={setImportOrders}
            onUpdateTransactions={setLedgerTransactions}
            onClose={() => setCurrentView('kanban')}
            deviceView={deviceView}
          />
        ) : null}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isCreatingCard && (
          <CardEditModal 
            card={{ id: 'temp', name: 'MỚI', tabId: activeTab === 0 ? 1 : activeTab, note: '', doDate: '', startDate: '', tags: [], logs: [], collapsed: false, doctorText: '', doctorDate: '', doctorHidden: false, notified: false, notifiedTime: '', doneDate: '' }}
            customers={customers}
            tagsConfig={tagsConfig}
            compressionSettings={compressionSettings}
            onClose={() => setIsCreatingCard(false)}
            onSave={(updates) => createCardConfirmed(updates)}
            onDelete={() => setIsCreatingCard(false)}
          />
        )}
 
        {editingCardId && (
          <CardEditModal 
            card={cards.find(c => c.id === editingCardId)!}
            customers={customers}
            tagsConfig={tagsConfig}
            compressionSettings={compressionSettings}
            onClose={() => setEditingCardId(null)}
            onSave={(updates) => {
              updateCard(editingCardId, updates);
              setEditingCardId(null);
            }}
            onDelete={() => {
              confirmAction("Bạn có chắc chắn muốn xóa thẻ này?", () => {
                deleteCard(editingCardId);
                setEditingCardId(null);
              });
            }}
          />
        )}
 
        {showOrderManagement && (
          <OrderManagementModal 
            orders={orders}
            customers={customers}
            products={products}
            onUpdateOrders={setOrders}
            onUpdateTransactions={setLedgerTransactions}
            ledgerTransactions={ledgerTransactions}
            ledgerPurposes={ledgerPurposes}
            ledgerAccounts={ledgerAccounts}
            onUpdateCustomers={setCustomers}
            customerGroups={customerGroups}
            onUpdateGroups={setCustomerGroups}
            compressionSettings={compressionSettings}
            onClose={() => setShowOrderManagement(false)}
            deviceView={deviceView}
          />
        )}
 
        {showCustomerManagement && (
          <CustomerManagementModal 
            customers={customers}
            customerGroups={customerGroups}
            transactions={ledgerTransactions}
            onClose={() => setShowCustomerManagement(false)}
            onUpdateCustomers={(newCustomers) => setCustomers(newCustomers)}
            onUpdateGroups={setCustomerGroups}
            onViewDebtHistory={(id) => {
              setDebtHistoryCustomerId(id);
              setCurrentView('ledger');
              setShowCustomerManagement(false);
            }}
            compressionSettings={compressionSettings}
            deviceView={deviceView}
          />
        )}
 
        {tagModalCardId && (
          <TagSelectionModal 
            card={cards.find(c => c.id === tagModalCardId)!}
            tagsConfig={tagsConfig}
            onClose={() => setTagModalCardId(null)}
            onUpdateCard={(updates) => {
              updateCard(tagModalCardId, updates);
            }}
          />
        )}
 
        {showTagManagement && (
          <TagManagementModal 
            tagsConfig={tagsConfig}
            onClose={() => setShowTagManagement(false)}
            onUpdateConfig={(newConfig) => {
              setTagsConfig(newConfig);
            }}
            deviceView={deviceView}
          />
        )}
 
        {historyCardId && (
          <CardHistoryModal 
            card={cards.find(c => c.id === historyCardId)!}
            onClose={() => setHistoryCardId(null)}
          />
        )}
 
        {noteEditCardId && (
          <NoteEditModal 
            card={cards.find(c => c.id === noteEditCardId)!}
            onClose={() => setNoteEditCardId(null)}
            onSave={(newNote) => {
              updateCard(noteEditCardId, { note: newNote });
              setNoteEditCardId(null);
            }}
          />
        )}
 
        {doctorReplyCardId && (
          <DoctorReplyModal 
            card={cards.find(c => c.id === doctorReplyCardId)!}
            onClose={() => setDoctorReplyCardId(null)}
            onSave={(reply) => {
              const updates: Partial<KanbanCard> = { 
                doctorText: reply,
                doctorDate: getTodayFormatted(),
                doctorHidden: !reply 
              };
              updateCard(doctorReplyCardId, updates);
              addLog(doctorReplyCardId, "Bác sĩ phản hồi");
              setDoctorReplyCardId(null);
            }}
          />
        )}
 
        {showAccountManagement && (
          <AccountManagementModal 
            accounts={users}
            onUpdateAccounts={setUsers}
            onClose={() => setShowAccountManagement(false)}
            deviceView={deviceView}
          />
        )}
 
        {showProductManagement && (
          <ProductManagementModal 
            brands={brands}
            categories={productCategories}
            products={products}
            onUpdateBrands={setBrands}
            onUpdateCategories={setProductCategories}
            onUpdateProducts={setProducts}
            onClose={() => setShowProductManagement(false)}
            compressionSettings={compressionSettings}
            deviceView={deviceView}
          />
        )}
 
        {addDoCardId && (
          <AddDoModal
            initialProducts={cards.find(c => c.id === addDoCardId)?.products || []}
            availableProducts={products}
            availableBrands={brands}
            username={username}
            onSave={(updatedProducts) => {
              updateCard(addDoCardId, { products: updatedProducts });
              setAddDoCardId(null);
            }}
            onClose={() => setAddDoCardId(null)}
          />
        )}
 
        {showSkinAudit && (
          <SkinAuditModal 
            customers={customers}
            skinAudits={skinAudits}
            skinAuditLogs={skinAuditLogs}
            username={username}
            onUpdateAudits={setSkinAudits}
            onUpdateLogs={setSkinAuditLogs}
            onClose={() => setShowSkinAudit(false)}
            deviceView={deviceView}
          />
        )}
 
        {showCompressionSettings && (
          <ImageCompressionModal 
            settings={compressionSettings}
            onUpdateSettings={setCompressionSettings}
            onClose={() => setShowCompressionSettings(false)}
            deviceView={deviceView}
          />
        )}
 
        {confirmConfig && (
          <ConfirmDialog 
            message={confirmConfig.message}
            onConfirm={confirmConfig.action}
            onCancel={() => setConfirmConfig(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
