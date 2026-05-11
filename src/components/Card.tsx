import React from "react";
import { 
  User as UserIcon, 
  Pencil, 
  Stethoscope, 
  Search as SearchIcon, 
  PlayCircle,
  CheckCircle,
  History,
  Clock,
  Notebook
} from "lucide-react";
import { cn, getTodayFormatted, getTimeFormatted } from "../lib/utils";
import { KanbanCard, TAB_NAMES } from "../types";

// Helper for tag colors (similar to logic in HTML)
const TAG_COLOR_PALETTE = [
  { bg: 'bg-rose-100',   text: 'text-rose-600',   border: 'border-rose-200'   },
  { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
  { bg: 'bg-amber-100',  text: 'text-amber-600',  border: 'border-amber-200'  },
  { bg: 'bg-emerald-100',text: 'text-emerald-600',border: 'border-emerald-200'},
  { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-sky-100',    text: 'text-sky-600',    border: 'border-sky-200'    },
  { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  { bg: 'bg-teal-100',   text: 'text-teal-600',   border: 'border-teal-200'   },
  { bg: 'bg-pink-100',   text: 'text-pink-600',   border: 'border-pink-200'   },
  { bg: 'bg-lime-100',   text: 'text-lime-600',   border: 'border-lime-200'   },
];

function getTagColors(tagText: string) {
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    hash = (hash * 31 + tagText.charCodeAt(i)) % TAG_COLOR_PALETTE.length;
  }
  return TAG_COLOR_PALETTE[hash];
}

interface CardProps {
  key?: string | number;
  card: KanbanCard;
  index: number;
  onEdit: () => void;
  onMove: (tabId: number) => void;
  onTagEdit: () => void;
  onHistory: () => void;
  onNoteEdit: () => void;
  onDoctorReply: () => void;
  onNotify: () => void;
  updateCard: (id: string, updates: Partial<KanbanCard>) => void;
}

export default function Card({ 
  card, 
  index, 
  onEdit, 
  onMove, 
  onTagEdit, 
  onHistory, 
  onNoteEdit, 
  onDoctorReply, 
  onNotify,
  updateCard
}: CardProps) {
  const isDone = card.tabId === 6;
  const isCollapsed = card.collapsed;

  const handleToggleCollapse = () => {
    updateCard(card.id, { collapsed: !isCollapsed });
  };

  const handleNotify = () => {
    updateCard(card.id, { 
      notified: true, 
      notifiedTime: `Đã báo: ${getTimeFormatted()}` 
    });
    onNotify();
  };

  return (
    <div className={cn(
      "bg-white rounded-[32px] p-5 shadow-sm border border-pastel-border relative transition-all",
      isDone && isCollapsed && "pb-4"
    )}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 text-[9px] font-black flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="w-9 h-9 rounded-full bg-pastel-pink/10 flex items-center justify-center shrink-0 text-pastel-pink">
            <UserIcon className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-[15px] uppercase tracking-wide truncate max-w-[120px]">
            {card.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <>
              <button 
                onClick={onEdit} 
                className="text-[10px] font-black text-pastel-subtext bg-pastel-bg px-2.5 py-1.5 rounded-full border border-pastel-border active:scale-95 transition-all"
              >
                Sửa thẻ
              </button>
              <button 
                onClick={onDoctorReply} 
                className={cn(
                  "text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-indigo-100 active:scale-95 transition-all",
                  card.doctorText && !card.doctorHidden && "opacity-40"
                )}
              >
                <Stethoscope className="w-3 h-3 fill-current" /> Bác sĩ phản hồi
              </button>
            </>
          )}
          {isDone && (
            <button 
              onClick={handleToggleCollapse}
              className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-200 active:scale-95 transition-all"
            >
              {isCollapsed ? "Mở" : "Đóng"}
            </button>
          )}
        </div>
      </div>

      {/* Done Summary (when collapsed in Step 6) */}
      {isDone && isCollapsed && (
        <div className="flex items-center gap-2 text-[10.5px] font-black flex-wrap mt-1">
          <span className="flex items-center gap-0.5 text-pastel-subtext">
            <PlayCircle className="w-3 h-3" /> Bắt đầu <b>{card.startDate}</b>
          </span>
          {card.doDate && (
            <>
              <span className="text-pastel-subtext">·</span>
              <span className="flex items-center gap-0.5 text-rose-400">
                <SearchIcon className="w-3 h-3" /> Ngày dò <b>{card.doDate}</b>
              </span>
            </>
          )}
          {card.doneDate && (
            <>
              <span className="text-pastel-subtext">·</span>
              <span className="flex items-center gap-0.5 text-emerald-600">
                <CheckCircle className="w-3 h-3" /> Xong <b>{card.doneDate}</b>
              </span>
            </>
          )}
        </div>
      )}

      {/* Body Content */}
      <div className={cn("space-y-3", isCollapsed && "hidden")}>
        <div className="px-1 relative">
          <p className="line-clamp-2 customer-text-content font-medium text-[13.5px] whitespace-pre-line text-pastel-text/90">
            {card.note}
          </p>
          <button 
            onClick={onNoteEdit} 
            className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1 active:opacity-70"
          >
            <Notebook className="w-3 h-3" /> Sửa ghi chú
          </button>
        </div>

        {card.doctorText && !card.doctorHidden && (
          <div className="bg-indigo-50/30 border-l-4 border-indigo-400 p-3 rounded-r-2xl mt-2 relative">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black text-indigo-600">{card.doctorDate}</span>
              <span className="text-[11px] font-black text-indigo-600">Bác sĩ phản hồi:</span>
            </div>
            <p className="text-[12.5px] line-clamp-2 mb-2 whitespace-pre-line text-pastel-text/90 font-medium italic">
              {card.doctorText}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={onDoctorReply} 
                className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-600 font-bold text-[10px]"
              >
                Sửa
              </button>
              {card.notified ? (
                <span className="bg-green-50 text-emerald-600 border border-green-200 px-2 py-1 rounded-lg font-bold text-[10px]">
                  {card.notifiedTime}
                </span>
              ) : (
                <button 
                  onClick={handleNotify}
                  className="px-2 py-1 rounded-lg bg-rose-500 text-white font-black text-[10px] active:scale-95"
                >
                  Báo khách
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-pastel-border/60 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between gap-3 min-w-max pb-1">
            <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
              <div className="flex items-center gap-3 text-[12.5px] font-black">
                <div className="flex items-center gap-1 text-pastel-subtext">
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="ml-0.5">Bắt đầu</span> <span>{card.startDate}</span>
                </div>
                <div className="flex items-center gap-1 text-rose-500">
                  <SearchIcon className="w-3.5 h-3.5" />
                  <span className="ml-0.5">Ngày dò</span> <span>{card.doDate}</span>
                </div>
                {card.tabId === 6 && card.doneDate && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="ml-0.5">Xong</span> <span>{card.doneDate}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 items-center">
                {card.tags.map(tag => {
                  const colors = getTagColors(tag);
                  return (
                    <span 
                      key={tag} 
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black border",
                        colors.bg, colors.text, colors.border
                      )}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>

              <button 
                onClick={onTagEdit}
                className="w-7 h-7 rounded-full bg-pastel-bg text-pastel-subtext flex items-center justify-center border border-pastel-border shrink-0 active:scale-90 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {card.tabId === 1 && (
                <>
                  <button 
                    onClick={() => onMove(2)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-600 font-bold text-[10px] border border-cyan-100 active:scale-95"
                  >
                    2. Gửi hàng
                  </button>
                  <button 
                    onClick={() => onMove(3)}
                    className="px-2.5 py-1.5 rounded-xl bg-pastel-green/10 text-emerald-600 font-bold text-[10px] border border-pastel-green/20 active:scale-95"
                  >
                    3. Add/Dò
                  </button>
                </>
              )}
              {card.tabId !== 6 && (
                <button 
                  onClick={() => onMove(6)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 font-bold text-[10px] border border-rose-100 active:scale-95"
                >
                  6. Xong
                </button>
              )}
              <button 
                onClick={onHistory}
                className="text-[10px] font-bold text-pastel-subtext flex items-center gap-1 bg-pastel-bg px-2.5 py-1.5 rounded-xl border border-pastel-border/50 active:scale-95"
              >
                <History className="w-3 h-3" /> Lịch sử
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
