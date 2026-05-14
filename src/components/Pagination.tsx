import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}

export function Pagination({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems }: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 px-2 lg:px-0">
      <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
        <span>Hiển thị</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
            className="bg-white border border-rose-100 rounded-xl px-2 py-1 outline-none focus:ring-4 focus:ring-rose-500/5 text-slate-700 shadow-sm"
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
        </select>
        <span>dòng</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-rose-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-50 hover:text-rose-500 transition-all bg-white shadow-sm active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageStr = i + 1;
          if (pageStr !== 1 && pageStr !== totalPages && Math.abs(currentPage - pageStr) > 2) {
             if (Math.abs(currentPage - pageStr) === 3) {
                return <span key={i} className="text-rose-200 px-1 font-black">...</span>;
             }
             return null;
          }

          return (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={cn(
                "min-w-[40px] h-10 px-3 flex items-center justify-center rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm",
                currentPage === i + 1 
                  ? "bg-rose-500 text-white border border-rose-600/10 shadow-lg shadow-rose-200" 
                  : "border border-rose-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 bg-white"
              )}
            >
              {i + 1}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-rose-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-50 hover:text-rose-500 transition-all bg-white shadow-sm active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
