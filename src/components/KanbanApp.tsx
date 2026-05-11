import React, { useState, useEffect, useRef } from "react";
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

  const getFilteredCards = (tabId: number) => {
    let list = cards;
    if (tabId === 0) {
      const todayStr = getTodayFormatted();
      list = cards.filter(c => c.doDate === todayStr && c.tabId !== 6);
    } else {
      list = cards.filter(c => c.tabId === tabId);
    }

    if (searchQuery) {
      list = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort by doDate
    return list.sort((a, b) => {
      const dateA = parseDateString(a.doDate);
      const dateB = parseDateString(b.doDate);
      return dateA.getTime() - dateB.getTime();
    });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-pastel-bg">
      {/* Header */}
      <header className="bg-white px-3 py-3 border-b border-pastel-border shrink-0 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <h1 className="text-xs font-bold text-rose-400">Hỗ trợ quản lý</h1>
        </div>

        <div className="flex-1 relative max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pastel-subtext w-4 h-4" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-pastel-bg border-none rounded-xl py-2.5 pl-9 pr-2 text-[11px] font-bold focus:ring-2 focus:ring-rose-200 outline-none transition-all" 
            placeholder="Tìm tên khách..."
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className={cn(
            "flex items-center gap-1 text-[9px] font-bold px-2 py-2.5 rounded-lg transition-all",
            saveStatus === "saving" && "bg-amber-50 text-amber-600 border border-amber-200",
            saveStatus === "saved" && "bg-emerald-50 text-emerald-600 border border-emerald-200",
            (saveStatus === "error" || saveStatus === "offline") && "bg-rose-50 text-rose-500 border border-rose-200"
          )}>
            {saveStatus === "saving" && <CloudUpload className="w-3 h-3" />}
            {saveStatus === "saved" && <Cloud className="w-3 h-3" />}
            {(saveStatus === "error" || saveStatus === "offline") && <CloudOff className="w-3 h-3" />}
            <span>{saveStatus === "saving" ? "Đang lưu" : saveStatus === "saved" ? "Đã lưu" : "Lỗi lưu"}</span>
          </div>
          
          <button 
            onClick={() => setShowTagManagement(true)}
            className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-2.5 rounded-lg border border-indigo-100 active:scale-95 transition-all"
          >
            Quản lý Tag
          </button>
          
          <button 
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="bg-white border-b border-pastel-border shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex px-2 py-3 gap-6 whitespace-nowrap min-w-max">
          {Object.entries(TAB_NAMES).map(([id, name]) => {
            const tabId = parseInt(id);
            const isActive = activeTab === tabId;
            return (
              <button 
                key={id}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "relative text-[13px] font-bold px-2 transition-all",
                  isActive ? "text-rose-400" : "text-pastel-subtext"
                )}
              >
                {name}
                {isActive && (
                  <div className="absolute -bottom-3 left-1/4 right-1/4 h-0.5 bg-rose-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Card List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {getFilteredCards(activeTab).length > 0 ? (
          getFilteredCards(activeTab).map((card, index) => (
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
      <div className="p-4 shrink-0 bg-white/50 backdrop-blur-sm border-t border-pastel-border/50">
        <button 
          onClick={handleCreateCard}
          className="w-full bg-rose-400 py-4 rounded-2xl text-white font-black text-[15px] shadow-lg shadow-rose-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" /> Tạo thẻ mới
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
