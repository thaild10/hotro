import React from "react";
import { X, Tag as TagIcon } from "lucide-react";
import { KanbanCard, Tag } from "../../types";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

// Helper for tag colors (duplicate for standalone usage or export if possible)
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
  for (let i = 0; i < tagText.length; i++) hash = (hash * 31 + tagText.charCodeAt(i)) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[hash];
}

interface TagSelectionModalProps {
  card: KanbanCard;
  tagsConfig: Record<number, Tag[]>;
  onClose: () => void;
  onUpdateCard: (updates: Partial<KanbanCard>) => void;
}

export default function TagSelectionModal({ card, tagsConfig, onClose, onUpdateCard }: TagSelectionModalProps) {
  const availTags = tagsConfig[card.tabId] || [];
  const [scheduleTime, setScheduleTime] = React.useState("");
  const showTimeInput = React.useRef(false);
  
  const toggleTag = (tagText: string) => {
    const currentTags = card.tags || [];
    // Single select for Tab 5 (Spa)
    if (card.tabId === 5) {
      if (currentTags.includes(tagText)) {
        onUpdateCard({ tags: [] });
      } else {
        // Special logic for "Xếp lịch"
        if (tagText === "Xếp lịch") {
          showTimeInput.current = true;
          // We'll handle the actual update after time selection
          return;
        }
        onUpdateCard({ tags: [tagText] });
      }
      return;
    }

    // Default multi-select
    if (currentTags.includes(tagText)) {
      onUpdateCard({ tags: currentTags.filter(t => t !== tagText) });
    } else {
      onUpdateCard({ tags: [...currentTags, tagText] });
    }
  };

  const handleScheduleConfirm = () => {
    if (!scheduleTime.trim()) return;
    const scheduleStr = `🔔 Hẹn: ${scheduleTime}`;
    // Update note automatically as requested
    const newNote = card.note ? `${card.note}\n${scheduleStr}` : scheduleStr;
    onUpdateCard({ 
      tags: ["Xếp lịch"],
      note: newNote
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center gap-3 mb-5 border-b pb-3 border-pastel-border">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-500">
            <TagIcon className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-pastel-text text-lg">Gán Tag</h3>
            <p className="text-[11px] font-bold text-pastel-subtext uppercase">{card.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {availTags.length > 0 ? availTags.map((tag, idx) => {
            if (!tag) return null;
            const colors = getTagColors(tag.text);
            const isActive = (card.tags || []).includes(tag.text);
            return (
              <button 
                key={`${tag.text}-${idx}-${card.id}`}
                onClick={() => toggleTag(tag.text)}
                className={cn(
                  "py-2.5 px-3 rounded-2xl text-[11px] font-black border transition-all active:scale-95",
                  isActive ? cn(colors.bg, colors.text, colors.border, "border-2") : "bg-pastel-bg text-pastel-subtext border-pastel-border"
                )}
              >
                {tag.text}
              </button>
            );
          }) : (
            <p className="col-span-2 text-center text-[11px] italic text-pastel-subtext py-6">
              Không có tag cho bước này
            </p>
          )}
        </div>

        {showTimeInput.current && (
          <div className="mb-6 animate-in slide-in-from-bottom-2">
            <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1 mb-1 block">Chọn giờ (hh.mm dd.mm)</label>
            <input 
              type="text"
              autoFocus
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              placeholder="09.00 20.10"
              className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-rose-200"
            />
            <button 
              onClick={handleScheduleConfirm}
              className="w-full mt-2 py-2 bg-rose-500 text-white rounded-xl text-xs font-black"
            >
              Xác nhận lịch
            </button>
          </div>
        )}

        <button 
          onClick={onClose} 
          className="w-full py-4 font-black text-white bg-rose-400 rounded-2xl shadow-lg shadow-rose-200/50 active:scale-95 transition-all"
        >
          Hoàn tất
        </button>
      </motion.div>
    </div>
  );
}
