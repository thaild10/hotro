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
  { bg: 'bg-rose-50',   text: 'text-rose-500',   border: 'border-rose-200'   },
  { bg: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-200' },
  { bg: 'bg-amber-50',  text: 'text-amber-500',  border: 'border-amber-200'  },
  { bg: 'bg-teal-50',   text: 'text-teal-500',   border: 'border-teal-200'   },
  { bg: 'bg-fuchsia-50',text: 'text-fuchsia-500',border: 'border-fuchsia-200'},
  { bg: 'bg-sky-50',    text: 'text-sky-500',    border: 'border-sky-200'    },
  { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' },
  { bg: 'bg-rose-50',   text: 'text-rose-500',   border: 'border-rose-200'   },
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 text-xs font-black flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 text-rose-400">
            <UserIcon className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-base uppercase tracking-wide truncate max-w-[120px]">
            {card.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <>
              <button 
                onClick={onEdit} 
                className="text-xs font-black text-pastel-subtext bg-pastel-bg px-4 py-2.5 rounded-2xl border border-pastel-border active:scale-95 transition-all min-h-[40px]"
              >
                Sửa thẻ
              </button>
              <button 
                onClick={onDoctorReply} 
                className={cn(
                  "text-xs font-black text-violet-500 bg-violet-50 px-4 py-2.5 rounded-2xl flex items-center gap-1.5 border border-violet-100 active:scale-95 transition-all min-h-[40px]",
                  card.doctorText && !card.doctorHidden && "opacity-40"
                )}
              >
                <Stethoscope className="w-4 h-4 fill-current" /> Bác sĩ phản hồi
              </button>
            </>
          )}
          {isDone && (
            <button 
              onClick={handleToggleCollapse}
              className="text-xs font-black text-teal-600 bg-teal-50 px-4 py-2.5 rounded-2xl border border-teal-200 active:scale-95 transition-all min-h-[40px]"
            >
              {isCollapsed ? "Mở" : "Đóng"}
            </button>
          )}
        </div>
      </div>

      {/* Done Summary (when collapsed in Step 6) */}
      {isDone && isCollapsed && (
        <div className="flex items-center gap-2 text-xs font-black flex-wrap mt-1">
          <span className="flex items-center gap-1 text-pastel-subtext">
            <PlayCircle className="w-3.5 h-3.5" /> Bắt đầu <b>{card.startDate}</b>
          </span>
          {card.doDate && (
            <>
              <span className="text-pastel-subtext">·</span>
              <span className="flex items-center gap-1 text-rose-400">
                <SearchIcon className="w-3.5 h-3.5" /> Ngày dò <b>{card.doDate}</b>
              </span>
            </>
          )}
          {card.doneDate && (
            <>
              <span className="text-pastel-subtext">·</span>
              <span className="flex items-center gap-0.5 text-teal-500">
                <CheckCircle className="w-3 h-3" /> Xong <b>{card.doneDate}</b>
              </span>
            </>
          )}
        </div>
      )}

      {/* Body Content */}
      <div className={cn("space-y-4", isCollapsed && "hidden")}>
        <div className="px-1 relative">
          <p className="line-clamp-2 customer-text-content font-medium text-sm whitespace-pre-line text-pastel-text/90">
            {card.note}
          </p>
          <button 
            onClick={onNoteEdit} 
            className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1.5 active:opacity-70 py-2"
          >
            <Notebook className="w-4 h-4" /> Sửa ghi chú
          </button>
        </div>

        {card.doctorText && !card.doctorHidden && (
          <div className="bg-violet-50/50 border-l-4 border-violet-300 p-4 rounded-r-2xl mt-2 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-violet-500">{card.doctorDate}</span>
              <span className="text-xs font-black text-violet-500">Bác sĩ phản hồi:</span>
            </div>
            <p className="text-sm line-clamp-2 mb-3 whitespace-pre-line text-pastel-text/90 font-medium italic">
              {card.doctorText}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={onDoctorReply} 
                className="px-3 py-2 rounded-xl bg-white border border-violet-200 text-violet-500 font-bold text-xs active:scale-95 min-h-[36px]"
              >
                Sửa
              </button>
              {card.notified ? (
                <span className="bg-teal-50 text-teal-600 border border-teal-200 px-3 py-2 rounded-xl font-bold text-xs min-h-[36px] flex items-center">
                  {card.notifiedTime}
                </span>
              ) : (
                <button 
                  onClick={handleNotify}
                  className="px-3 py-2 rounded-xl bg-rose-400 text-white font-black text-xs active:scale-95 min-h-[36px]"
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
        <div className="mt-5 pt-4 border-t border-pastel-border/60 overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-center justify-between gap-4 min-w-max">
            <div className="flex items-center gap-4 whitespace-nowrap shrink-0">
              <div className="flex items-center gap-3 text-xs font-black">
                <div className="flex items-center gap-1.5 text-pastel-subtext">
                  <PlayCircle className="w-4 h-4" />
                  <span className="ml-0.5">Bắt đầu</span> <span>{card.startDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-500">
                  <SearchIcon className="w-4 h-4" />
                  <span className="ml-0.5">Ngày dò</span> <span>{card.doDate}</span>
                </div>
                {card.tabId === 6 && card.doneDate && (
                  <div className="flex items-center gap-1.5 text-teal-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="ml-0.5">Xong</span> <span>{card.doneDate}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-center">
                {card.tags.map(tag => {
                  const colors = getTagColors(tag);
                  return (
                    <span 
                      key={tag} 
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] uppercase font-black border",
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
                className="w-10 h-10 rounded-full bg-pastel-bg text-pastel-subtext flex items-center justify-center border border-pastel-border shrink-0 active:scale-90 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {card.tabId === 1 && (
                <>
                  <button 
                    onClick={() => onMove(2)}
                    className="px-4 py-2.5 rounded-2xl bg-sky-50 text-sky-500 font-bold text-xs border border-sky-100 active:scale-95 min-h-[40px]"
                  >
                    2. Gửi hàng
                  </button>
                  <button 
                    onClick={() => onMove(3)}
                    className="px-4 py-2.5 rounded-2xl bg-teal-50 text-teal-600 font-bold text-xs border border-teal-100 active:scale-95 min-h-[40px]"
                  >
                    3. Add/Dò
                  </button>
                </>
              )}
              {card.tabId !== 6 && (
                <button 
                  onClick={() => onMove(6)}
                  className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-500 font-bold text-xs border border-rose-100 active:scale-95 min-h-[40px]"
                >
                  6. Xong
                </button>
              )}
              <button 
                onClick={onHistory}
                className="text-xs font-bold text-pastel-subtext flex items-center gap-1.5 bg-pastel-bg px-4 py-2.5 rounded-2xl border border-pastel-border/50 active:scale-95 min-h-[40px]"
              >
                <History className="w-4 h-4" /> Lịch sử
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
