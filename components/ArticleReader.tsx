
import React, { useState, useRef, useEffect } from 'react';
import { Article } from '../types';
import { generateAudioNarration, decodeBase64, decodeAudioData } from '../services/geminiService';
import { Play, Pause, RotateCcw, Loader2, Sparkles, BookOpenCheck, FastForward, Rewind, Languages } from 'lucide-react';

interface ArticleReaderProps {
  article: Article;
  onAddWord: (word: string) => void;
  knownWords: string[];
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onAddWord, knownWords }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  const handleGenerateAudio = async () => {
    if (isLoadingAudio || audioBufferRef.current) return;
    
    setIsLoadingAudio(true);
    try {
      // Due to TTS limits, we take the first significant part of long articles for audio
      const base64 = await generateAudioNarration(`${article.title}. ${article.content.substring(0, 4000)}`);
      const rawData = decodeBase64(base64);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const buffer = await decodeAudioData(rawData, audioContextRef.current);
      audioBufferRef.current = buffer;
      playFrom(0, playbackSpeed);
    } catch (error) {
      console.error("Audio failed", error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playFrom = (offset: number, speed: number) => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    
    const clampedOffset = Math.max(0, Math.min(offset, audioBufferRef.current.duration));

    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = speed;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      const currentRealTime = audioContextRef.current!.currentTime;
      // Duration is stretched/compressed by speed
      const adjustedDuration = (audioBufferRef.current!.duration - clampedOffset) / speed;
      const expectedEndTime = startTimeRef.current + adjustedDuration;
      
      if (Math.abs(currentRealTime - expectedEndTime) < 0.5) {
        setIsPlaying(false);
        offsetRef.current = 0;
      }
    };

    source.start(0, clampedOffset);
    sourceRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime;
    offsetRef.current = clampedOffset;
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!audioBufferRef.current) {
      handleGenerateAudio();
      return;
    }

    if (isPlaying) {
      sourceRef.current?.stop();
      if (audioContextRef.current) {
        const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackSpeed;
        offsetRef.current += elapsed;
      }
      setIsPlaying(false);
    } else {
      playFrom(offsetRef.current, playbackSpeed);
    }
  };

  const skip = (seconds: number) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    
    let currentOffset = offsetRef.current;
    if (isPlaying) {
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackSpeed;
      currentOffset += elapsed;
    }
    
    playFrom(currentOffset + seconds, playbackSpeed);
  };

  const handleSpeedChange = (newSpeed: number) => {
    const wasPlaying = isPlaying;
    let currentOffset = offsetRef.current;
    
    if (isPlaying && audioContextRef.current) {
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackSpeed;
      currentOffset += elapsed;
      sourceRef.current?.stop();
    }
    
    setPlaybackSpeed(newSpeed);
    if (wasPlaying) {
      playFrom(currentOffset, newSpeed);
    } else {
      offsetRef.current = currentOffset;
    }
  };

  const restart = () => {
    if (audioBufferRef.current) {
      playFrom(0, playbackSpeed);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    if (word && word.length > 1 && word.split(/\s+/).length === 1) {
      onAddWord(word);
    }
  };

  const renderContentWithHighlights = (text: string) => {
    if (!knownWords || knownWords.length === 0) return text;
    const sortedWords = [...knownWords].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`\\b(${sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const isKnown = sortedWords.some(kw => kw.toLowerCase() === part.toLowerCase());
      if (isKnown) {
        return (
          <span 
            key={i} 
            className="bg-indigo-100 text-indigo-900 px-0.5 rounded-sm border-b-2 border-indigo-300 border-dotted cursor-help"
            title="In your vocabulary bank"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mb-4">Long-form Analysis • {article.topic}</p>
        <h1 className="serif-font text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">{article.title}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-8">
          <span>{article.date}</span>
          <span>•</span>
          <span>Approx. 1,000 words</span>
          <span>•</span>
          <span>AI Narrator</span>
        </div>
        
        <div className="flex flex-col items-center gap-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => skip(-10)} 
              disabled={!audioBufferRef.current}
              className="p-3 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
            >
              <Rewind className="w-6 h-6 fill-current" />
            </button>

            <button 
              onClick={togglePlay}
              disabled={isLoadingAudio}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${isLoadingAudio ? 'bg-slate-100' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
            >
              {isLoadingAudio ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> : isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            <button 
              onClick={() => skip(10)} 
              disabled={!audioBufferRef.current}
              className="p-3 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
            >
              <FastForward className="w-6 h-6 fill-current" />
            </button>
          </div>
          
          <div className="flex flex-col items-center w-full gap-4">
            <div className="flex items-center justify-between w-full px-2">
               <div className="flex items-center gap-3 text-slate-400">
                  <RotateCcw onClick={restart} className={`w-4 h-4 cursor-pointer hover:text-indigo-600 transition-colors ${!audioBufferRef.current && 'opacity-30 pointer-events-none'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                     {isLoadingAudio ? 'Generating Voice...' : audioBufferRef.current ? (isPlaying ? 'Playing' : 'Paused') : 'Ready'}
                  </span>
               </div>
               
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 {[0.8, 1.0, 1.2].map((s) => (
                   <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${playbackSpeed === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {s.toFixed(1)}x
                   </button>
                 ))}
               </div>
            </div>
            
            {audioBufferRef.current && (
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-400 transition-all duration-300" 
                  style={{ 
                    width: `${((offsetRef.current + (isPlaying ? (audioContextRef.current!.currentTime - startTimeRef.current) * playbackSpeed : 0)) / audioBufferRef.current.duration) * 100}%` 
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50/50 border-l-4 border-amber-200 p-6 rounded-r-xl mb-12 italic text-slate-700 leading-relaxed text-lg">
        "{article.summary}"
      </div>

      <div 
        className="serif-font text-xl text-slate-800 leading-[1.8] space-y-8 selection:bg-indigo-200/50 selection:text-indigo-900 cursor-text mb-16"
        onMouseUp={handleTextSelection}
      >
        {article.content.split('\n').filter(p => p.trim()).map((paragraph, i) => (
          <p key={i}>{renderContentWithHighlights(paragraph)}</p>
        ))}
      </div>

      {article.translation && (
        <div className="mt-24 pt-16 border-t border-slate-200">
          <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em] mb-8">
            <Languages className="w-4 h-4" /> 
            Chinese Translation • 中文翻译
          </div>
          <div className="text-slate-600 text-lg leading-loose space-y-6">
            {article.translation.split('\n').filter(p => p.trim()).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
        <div className="flex items-center gap-2 text-sm italic">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Double-click to capture words. Audio covers first 4000 chars.
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <BookOpenCheck className="w-4 h-4" />
          {knownWords.length} terms in bank
        </div>
      </div>
    </div>
  );
};
