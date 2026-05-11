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
  Monitor,
  Smartphone,
  Stethoscope
} from "lucide-react";
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
  UserAccount,
  Brand,
  ProductCategory,
  Product,
  SkinAuditEntry,
  SkinAuditLog,
  ImageCompressionSettings
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
import { ConfirmDialog } from "./Modals/ConfirmDialog";

interface KanbanAppProps {
  username: string;
  initialData: AppData;
  onLogout: () => void;
}

export default function KanbanApp({ username, initialData, onLogout }: KanbanAppProps) {
  const [cards, setCards] = useState<KanbanCard[]>(initialData.cards || []);
  const [tagsConfig, setTagsConfig] = useState<Record<number, Tag[]>>(initialData.tagsConfig || DEFAULT_TAGS);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers || []);
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
  }, []);

  // Determine user role
  const currentUserRole = users.find(u => u.username === username)?.role || "Admin"; // Defaults to Admin if unconfigured

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
      const skinAuditsMatch = JSON.stringify(serverSkinAudits) === JSON.stringify(skinAudits);
      const skinAuditLogsMatch = JSON.stringify(serverSkinAuditLogs) === JSON.stringify(skinAuditLogs);
      const compressionSettingsMatch = JSON.stringify(serverCompressionSettings) === JSON.stringify(compressionSettings);

      if (!cardsMatch) {
        setCards(serverCards);
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
    const skinAuditsChanged = JSON.stringify(prevSkinAuditsRef.current) !== JSON.stringify(skinAudits);
    const skinAuditLogsChanged = JSON.stringify(initialData.skinAuditLogs) !== JSON.stringify(skinAuditLogs);
    const compressionSettingsChanged = JSON.stringify(initialData.compressionSettings) !== JSON.stringify(compressionSettings);

    const shouldSave = cardsChanged || tagsChanged || customersChanged || usersChanged || brandsChanged || categoriesChanged || productsChanged || skinAuditsChanged || skinAuditLogsChanged || compressionSettingsChanged;

    if (shouldSave) {
      const saveData = async () => {
        setSaveStatus("saving");
        try {
          const docRef = doc(db, "appdata", "shared_kanban");
          await setDoc(docRef, { 
            cards: cards.map(c => ({
              ...c,
              // Ensure no undefined values which might cause rule issues
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
            skinAudits,
            skinAuditLogs,
            compressionSettings
          });
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

      const timer = setTimeout(saveData, 2000); // Increased debounce to 2s
      return () => clearTimeout(timer);
    }
  }, [cards, tagsConfig, customers, users, brands, productCategories, products, skinAudits]);

  const handleCreateCard = () => {
    setIsCreatingCard(true);
    if (activeTab === 0) setActiveTab(1);
  };

  const createCardConfirmed = (updates: Partial<KanbanCard>) => {
    const targetTabId = activeTab === 0 ? 1 : activeTab;
    const actionName = TAB_NAMES[targetTabId];
    const log = `${username} - Tạo thẻ mới tại ${actionName} - ${getTimeFormatted()}`;
    
    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      tabId: targetTabId,
      name: updates.name || "MỚI",
      note: updates.note || "",
      doDate: updates.doDate || "",
      startDate: getTodayFormatted(),
      tags: [],
      logs: [log],
      collapsed: false,
      doctorText: "",
      doctorDate: "",
      doctorHidden: false,
      notified: false,
      notifiedTime: "",
      doneDate: ""
    };
    
    setCards(prev => [newCard, ...prev]);
    setIsCreatingCard(false);
  };

  const updateCard = (cardId: string, updates: Partial<KanbanCard>) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));
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
        
        if (targetTabId === 7) {
          updates.collapsed = true;
          updates.doneDate = getTodayFormatted();
        } else {
          updates.collapsed = false;
        }
        
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
          collapsed: false,
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

    // Sort by doDate
    return [...list].sort((a, b) => {
      const dateA = parseDateString(a.doDate);
      const dateB = parseDateString(b.doDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [cards, activeTab, searchQuery, overdueCards]);

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden bg-pastel-bg transition-all duration-300 ease-in-out",
      deviceView === 'mobile' ? "max-w-[430px] mx-auto border-x border-slate-200 shadow-2xl relative" : "w-full"
    )}>
      {/* Header */}
      <header className="bg-white px-3 py-3 border-b border-pastel-border shrink-0 shadow-sm flex items-center justify-between gap-3">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-subtext w-5 h-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-pastel-bg border-none rounded-2xl py-3 pl-12 pr-4 text-base font-bold focus:ring-2 focus:ring-rose-200 outline-none transition-all" 
            placeholder="Tìm tên khách..."
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 overflow-x-auto no-scrollbar max-w-[65%] sm:max-w-none pb-1 snap-x">
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-2xl transition-all mr-2 shrink-0 snap-center",
            saveStatus === "saving" && "bg-amber-50 text-amber-500 border border-amber-200",
            saveStatus === "saved" && "bg-teal-50 text-teal-600 border border-teal-200",
            (saveStatus === "error" || saveStatus === "offline") && "bg-red-50 text-red-500 border border-red-200"
          )}>
            {saveStatus === "saving" && <CloudUpload className="w-6 h-6" />}
            {saveStatus === "saved" && <Cloud className="w-6 h-6" />}
            {(saveStatus === "error" || saveStatus === "offline") && <CloudOff className="w-6 h-6" />}
          </div>

          <div className="relative group shrink-0 snap-center">
            <button 
              onClick={() => setShowCompressionSettings(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-500 border border-indigo-100 active:scale-95 transition-all"
            >
              <CloudUpload className="w-6 h-6" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
              Nén ảnh
            </div>
          </div>

          <div className="relative group shrink-0 snap-center">
            <button 
              onClick={() => setShowSkinAudit(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-500 border border-teal-100 active:scale-95 transition-all"
            >
              <Stethoscope className="w-6 h-6" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
              Kiểm da
            </div>
          </div>
          
          {currentUserRole === 'Admin' && (
            <>
              <div className="relative group shrink-0 snap-center">
                <button 
                  onClick={() => setShowTagManagement(true)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50 text-violet-500 border border-violet-100 active:scale-95 transition-all"
                >
                  <TagIcon className="w-6 h-6" />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                  Tag
                </div>
              </div>

              <div className="relative group shrink-0 snap-center">
                <button 
                  onClick={() => setShowAccountManagement(true)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-500 border border-indigo-100 active:scale-95 transition-all"
                >
                  <Shield className="w-6 h-6" />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                  Tài khoản
                </div>
              </div>

              <div className="relative group shrink-0 snap-center">
                <button 
                  onClick={() => setShowProductManagement(true)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500 border border-amber-100 active:scale-95 transition-all"
                >
                  <Package className="w-6 h-6" />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                  Sản phẩm
                </div>
              </div>
            </>
          )}

          <div className="relative group shrink-0 snap-center">
            <button 
              onClick={() => setShowCustomerManagement(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 active:scale-95 transition-all"
            >
              <Users className="w-6 h-6" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
              Khách hàng
            </div>
          </div>

          <div className="relative group shrink-0 snap-center">
            <button 
              onClick={() => setDeviceView(prev => prev === 'desktop' ? 'mobile' : 'desktop')}
              className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 active:scale-95 transition-all"
            >
              {deviceView === 'desktop' ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6 text-rose-400" />}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
              {deviceView === 'desktop' ? 'Mobile' : 'Desktop'}
            </div>
          </div>
          
          <div className="relative group shrink-0 snap-center">
            <button 
              onClick={() => confirmAction("Bạn có chắc chắn muốn đăng xuất?", onLogout)}
              className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 active:scale-95 transition-all"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <div className="absolute top-full mt-2 left-1 ml-[-40px] bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
              Đăng xuất
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="bg-white border-b border-pastel-border shrink-0 overflow-x-auto no-scrollbar touch-pan-x">
        <div className="flex px-3 py-4 gap-6 whitespace-nowrap min-w-max items-center h-[56px]">
          {Object.entries(TAB_NAMES).map(([id, name]) => {
            const tabId = parseInt(id);
            const isActive = activeTab === tabId;
            return (
              <button 
                key={id}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "relative text-[15px] font-bold px-2 py-1 transition-all h-full flex items-center",
                  isActive ? "text-rose-500" : "text-pastel-subtext"
                )}
              >
                {name}
                {tabId === 0 && (
                  <span className={cn(
                    "ml-1.5 flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-black",
                    isActive ? "bg-rose-100 text-rose-500" : "bg-pastel-bg text-pastel-subtext"
                  )}>
                    {overdueCards.length}
                  </span>
                )}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/4 right-1/4 h-1 bg-rose-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Card List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
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
      <div className="p-4 shrink-0 bg-white border-t border-pastel-border/50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button 
          onClick={handleCreateCard}
          className="w-full bg-rose-400 py-4 rounded-[20px] text-white font-black text-base shadow-lg shadow-rose-200/50 flex items-center justify-center gap-2 active:scale-95 transition-transform min-h-[56px]"
        >
          <Plus className="w-6 h-6" /> Tạo thẻ mới
        </button>
      </div>

      {/* Modals */}
      {isCreatingCard && (
        <CardEditModal 
          card={{ id: 'temp', name: 'MỚI', tabId: 1, note: '', doDate: '', startDate: '', tags: [], logs: [], collapsed: false, doctorText: '', doctorDate: '', doctorHidden: false, notified: false, notifiedTime: '', doneDate: '' }}
          customers={customers}
          onClose={() => setIsCreatingCard(false)}
          onSave={(updates) => createCardConfirmed(updates)}
          onDelete={() => setIsCreatingCard(false)}
        />
      )}

      {editingCardId && (
        <CardEditModal 
          card={cards.find(c => c.id === editingCardId)!}
          customers={customers}
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

      {showCustomerManagement && (
        <CustomerManagementModal 
          customers={customers}
          onClose={() => setShowCustomerManagement(false)}
          onUpdateCustomers={(newCustomers) => setCustomers(newCustomers)}
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
    </div>
  );
}
