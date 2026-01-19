
import React from 'react';
import { TOPIC_OPTIONS, Headline } from '../types.ts';
import { Newspaper, ArrowRight, BookOpen, Globe, PlayCircle } from 'lucide-react';

interface TopicPickerProps {
  onSelect: (topic: string) => void;
  onSelectHeadline: (headline: Headline) => void;
  headlines: Headline[];
  loadingHeadlines: boolean;
}

export const TopicPicker: React.FC<TopicPickerProps> = ({ onSelect, onSelectHeadline, headlines, loadingHeadlines }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-16">
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Newspaper className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Daily Learning Hub</h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Immersive news reports and deep analysis designed for advanced English mastery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Topic Selection Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              1,000-Word Deep Dives
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Curated Topics</span>
          </div>
          {TOPIC_OPTIONS.map((topic) => (
            <button
              key={topic}
              onClick={() => onSelect(topic)}
              className="group p-6 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">Premium Analysis</span>
              <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-indigo-600 leading-tight">{topic}</h3>
              <div className="flex items-center gap-2 text-slate-400 font-medium text-sm group-hover:text-indigo-500 transition-colors">
                Generate Study Report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar Headlines */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 h-fit shadow-inner">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Global Headlines
          </h2>
          
          <div className="space-y-6">
            {loadingHeadlines ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              ))
            ) : headlines.length > 0 ? (
              headlines.map((news, i) => (
                <button 
                  key={i} 
                  onClick={() => onSelectHeadline(news)}
                  className="block w-full text-left group bg-white p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{news.source}</p>
                    <PlayCircle className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug mb-3">
                    {news.title}
                  </h4>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                    Convert to Lesson &rarr;
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">Could not load current news. Check back later.</p>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200">
             <p className="text-[11px] text-slate-400 leading-relaxed italic text-center">
               Click any headline to generate a full language study article.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
