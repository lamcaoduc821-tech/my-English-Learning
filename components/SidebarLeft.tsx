
import React from 'react';
import { StudySession } from '../types.ts';
import { Calendar, Clock, BookOpen } from 'lucide-react';

interface SidebarLeftProps {
  history: StudySession[];
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ history }) => {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="w-full lg:w-72 bg-white border-r border-slate-200 h-screen overflow-y-auto p-6 sticky top-0 flex flex-col gap-8">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl mb-4">
        <BookOpen className="w-6 h-6" />
        <span>Daily Lexis</span>
      </div>

      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Study Calendar
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            const dateStr = d.toISOString().split('T')[0];
            const isStudied = history.some(s => s.date === dateStr);
            const isToday = dateStr === today;
            
            return (
              <div 
                key={dateStr}
                title={dateStr}
                className={`h-8 rounded-sm flex items-center justify-center text-[10px] cursor-help transition-all
                  ${isStudied ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}
                  ${isToday ? 'ring-2 ring-indigo-200 border border-indigo-400' : ''}
                `}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 italic text-center">Last 14 days activity</p>
      </section>

      <section className="flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Recent Articles
        </h3>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No history yet.</p>
          ) : (
            history.slice().reverse().map((session, idx) => (
              <div key={idx} className="group cursor-default">
                <p className="text-[10px] text-slate-400 mb-1">{session.date}</p>
                <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                  {session.title}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
