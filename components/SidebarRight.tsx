
import React, { useState } from 'react';
import { VocabularyWord } from '../types.ts';
import { Plus, Search, Trash2, Bookmark, Languages, Quote, Layers, MessageSquare, Tag } from 'lucide-react';

interface SidebarRightProps {
  words: VocabularyWord[];
  onAddWord: (word: string) => void;
  onRemoveWord: (id: string) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({ words, onAddWord, onRemoveWord }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddWord(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="w-full lg:w-96 bg-white border-l border-slate-200 h-screen overflow-y-auto p-6 sticky top-0 flex flex-col gap-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Bookmark className="w-4 h-4" /> Vocabulary Bank
        </h3>
        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {words.length} Words
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Lookup new word..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        />
        <button type="submit" className="absolute right-2 top-1.5 text-slate-400 hover:text-indigo-600">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex-1 space-y-4">
        {words.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Your bank is empty. Highlight or type words to save them.</p>
          </div>
        ) : (
          words.slice().reverse().map((word) => (
            <div key={word.id} className="p-4 bg-white rounded-xl border border-slate-200 group relative shadow-sm hover:shadow-md transition-shadow">
              <button 
                onClick={() => onRemoveWord(word.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex flex-col mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-lg">{word.word}</h4>
                  {word.partOfSpeech && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold italic">
                      {word.partOfSpeech}
                    </span>
                  )}
                  <span className="text-indigo-600 text-sm font-medium">{word.chinese}</span>
                </div>
              </div>
              
              <div className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Languages className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                  <p className="text-[12px] text-slate-600 leading-relaxed italic">
                    {word.english}
                  </p>
                </div>

                {word.example && (
                  <div className="flex gap-2 bg-slate-50 p-2 rounded-lg">
                    <Quote className="w-3.5 h-3.5 text-indigo-300 mt-1 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {word.example}
                    </p>
                  </div>
                )}

                {word.phrases && word.phrases.length > 0 && (
                  <div className="flex gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {word.phrases.map((p, idx) => (
                        <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {word.deformations && word.deformations.length > 0 && (
                  <div className="flex gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                    <p className="text-[10px] text-slate-400">
                      Forms: <span className="text-slate-500">{word.deformations.join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
