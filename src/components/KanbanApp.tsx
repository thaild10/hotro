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
  X
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
  DEFAULT_TAGS 
} from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import Card from "./Card";
import CardEditModal from "./Modals/CardEditModal";
import TagManagementModal from "./Modals/TagManagementModal";
import CardHistoryModal from "./Modals/CardHistoryModal";
import TagSelectionModal from "./Modals/TagSelectionModal";
import NoteEditModal from "./Modals/NoteEditModal";
import DoctorReplyModal from "./Modals/DoctorReplyModal";

interface KanbanAppProps {
  username: string;
  initialData: AppData;
  onLogout: () => void;
}

export default function KanbanApp({ username, initialData, onLogout }: KanbanAppProps) {
  const [cards, setCards] = useState<KanbanCard[]>(initialData.cards || []);
  const [tagsConfig, setTagsConfig] = useState<Record<number, Tag[]>>(initialData.tagsConfig || DEFAULT_TAGS);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "offline">("saved");
  
  // Modal states
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [tagModalCardId, setTagModalCardId] = useState<string | null>(null);
  const [historyCardId, setHistoryCardId] = useState<string | null>(null);
  const [noteEditCardId, setNoteEditCardId] = useState<string | null>(null);
  const [doctorReplyCardId, setDoctorReplyCardId] = useState<string | null>(null);
  const [showTagManagement, setShowTagManagement] = useState(false);

  const prevCardsRef = useRef(cards);
  const prevTagsRef = useRef(tagsConfig);

  // Update local state when incoming data changes (remote updates)
  useEffect(() => {
    const serverCards = initialData.cards || [];
    const serverTags = initialData.tagsConfig || DEFAULT_TAGS;

    if (saveStatus === "saved") {
      const cardsMatch = JSON.stringify(serverCards) === JSON.stringify(cards);
      const tagsMatch = JSON.stringify(serverTags) === JSON.stringify(tagsConfig);

      if (!cardsMatch) {
        setCards(serverCards);
        prevCardsRef.current = serverCards;
      }
      if (!tagsMatch) {
        setTagsConfig(serverTags);
        prevTagsRef.current = serverTags;
      }
    }
  }, [initialData, saveStatus]);

  // Sync with Firestore
  useEffect(() => {
    const cardsChanged = JSON.stringify(prevCardsRef.current) !== JSON.stringify(cards);
    const tagsChanged = JSON.stringify(prevTagsRef.current) !== JSON.stringify(tagsConfig);
    const shouldSave = cardsChanged || tagsChanged;

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
              notifiedTime: c.notifiedTime || ""
            })), 
            tagsConfig 
          });
          setSaveStatus("saved");
          prevCardsRef.current = cards;
          prevTagsRef.current = tagsConfig;
        } catch (err) {
          console.error("Save error:", err);
          setSaveStatus("error");
        }
      };

      const timer = setTimeout(saveData, 2000); // Increased debounce to 2s
      return () => clearTimeout(timer);
    }
  }, [cards, tagsConfig]);

  const handleCreateCard = () => {
    const targetTab = activeTab === 0 ? 1 : activeTab;
    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      tabId: targetTab,
      name: "MỚI",
      note: "",
      doDate: "",
      startDate: getTodayFormatted(),
      tags: [],
      logs: [`${username} - Tạo thẻ mới - ${getTimeFormatted()}`],
    };
    setCards([newCard, ...cards]);
    if (activeTab === 0) setActiveTab(1);
    setEditingCardId(newCard.id);
  };

  const updateCard = (cardId: string, updates: Partial<KanbanCard>) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));
  };

  const moveCard = (cardId: string, targetTabId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    let updates: Partial<KanbanCard> = { tabId: targetTabId };
    const actionName = TAB_NAMES[targetTabId];
    const log = `${username} - Chuyển sang ${actionName} - ${getTimeFormatted()}`;
    updates.logs = [log, ...card.logs];

    if (targetTabId === 6) {
      updates.doneDate = getTodayFormatted();
      updates.collapsed = true;
    } else {
      updates.collapsed = false;
    }

    updateCard(cardId, updates);
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

  const filteredCards = useMemo(() => {
    let list = cards;
    if (activeTab === 0) {
      const todayStr = getTodayFormatted();
      list = cards.filter(c => c.doDate === todayStr && c.tabId !== 6);
    } else {
      list = cards.filter(c => c.tabId === activeTab);
    }

    if (searchQuery) {
      list = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort by doDate
    return [...list].sort((a, b) => {
      const dateA = parseDateString(a.doDate);
      const dateB = parseDateString(b.doDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [cards, activeTab, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-pastel-bg">
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

        <div className="flex items-center gap-3 shrink-0">
          <div className={cn(
            "flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-2xl transition-all",
            saveStatus === "saving" && "bg-amber-50 text-amber-500 border border-amber-200",
            saveStatus === "saved" && "bg-teal-50 text-teal-600 border border-teal-200",
            (saveStatus === "error" || saveStatus === "offline") && "bg-red-50 text-red-500 border border-red-200"
          )}>
            {saveStatus === "saving" && <CloudUpload className="w-5 h-5" />}
            {saveStatus === "saved" && <Cloud className="w-5 h-5" />}
            {(saveStatus === "error" || saveStatus === "offline") && <CloudOff className="w-5 h-5" />}
            <span className="hidden sm:inline">{saveStatus === "saving" ? "Đang lưu" : saveStatus === "saved" ? "Đã lưu" : "Lỗi lưu"}</span>
          </div>
          
          <button 
            onClick={() => setShowTagManagement(true)}
            className="text-sm font-bold bg-violet-50 text-violet-500 px-4 py-3 rounded-2xl border border-violet-100 active:scale-95 transition-all text-center flex items-center min-h-[48px]"
          >
            Quản lý Tag
          </button>
          
          <button 
            onClick={onLogout}
            className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 active:scale-95 transition-all shrink-0"
          >
            <LogOut className="w-6 h-6" />
          </button>
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
              index={index}
              onEdit={() => setEditingCardId(card.id)}
              onMove={(tid) => moveCard(card.id, tid)}
              onTagEdit={() => setTagModalCardId(card.id)}
              onHistory={() => setHistoryCardId(card.id)}
              onNoteEdit={() => setNoteEditCardId(card.id)}
              onDoctorReply={() => setDoctorReplyCardId(card.id)}
              onNotify={() => addLog(card.id, "Báo khách")}
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
      {editingCardId && (
        <CardEditModal 
          card={cards.find(c => c.id === editingCardId)!}
          onClose={() => setEditingCardId(null)}
          onSave={(updates) => {
            updateCard(editingCardId, updates);
            setEditingCardId(null);
          }}
          onDelete={() => {
            deleteCard(editingCardId);
            setEditingCardId(null);
          }}
        />
      )}

      {tagModalCardId && (
        <TagSelectionModal 
          card={cards.find(c => c.id === tagModalCardId)!}
          tagsConfig={tagsConfig}
          onClose={() => setTagModalCardId(null)}
          onUpdateTags={(newTags) => {
            updateCard(tagModalCardId, { tags: newTags });
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
    </div>
  );
}
