
import React, { useState, useEffect } from 'react';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { TopicPicker } from './components/TopicPicker';
import { ArticleReader } from './components/ArticleReader';
import { AppState, Article, VocabularyWord, StudySession, Headline } from './types';
import { generateArticleForTopic, getWordDefinition, fetchNewsHeadlines, generateArticleFromHeadline } from './services/geminiService';
import { Loader2, Menu, X, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.PICKING_TOPIC);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [history, setHistory] = useState<StudySession[]>([]);
  const [vocab, setVocab] = useState<VocabularyWord[]>([]);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('lexis_history');
    const savedVocab = localStorage.getItem('lexis_vocab');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedVocab) setVocab(JSON.parse(savedVocab));

    // Fetch initial headlines
    loadHeadlines();
  }, []);

  const loadHeadlines = async () => {
    setLoadingHeadlines(true);
    try {
      const news = await fetchNewsHeadlines();
      setHeadlines(news);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHeadlines(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('lexis_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('lexis_vocab', JSON.stringify(vocab));
  }, [vocab]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const recordSession = (article: Article) => {
    const today = new Date().toISOString().split('T')[0];
    if (!history.some(s => s.date === today && s.articleId === article.id)) {
      setHistory(prev => [...prev, {
        date: today,
        articleId: article.id,
        title: article.title
      }]);
    }
  };

  const handleTopicSelection = async (topic: string) => {
    setState(AppState.LOADING_ARTICLE);
    try {
      const article = await generateArticleForTopic(topic);
      setCurrentArticle(article);
      setState(AppState.READING);
      recordSession(article);
    } catch (error) {
      console.error("Failed to load article", error);
      showToast("Generation failed. Please try again.");
      setState(AppState.PICKING_TOPIC);
    }
  };

  const handleHeadlineSelection = async (headline: Headline) => {
    setState(AppState.LOADING_ARTICLE);
    try {
      const article = await generateArticleFromHeadline(headline);
      setCurrentArticle(article);
      setState(AppState.READING);
      recordSession(article);
    } catch (error) {
      console.error("Failed to convert headline", error);
      showToast("Headline conversion failed.");
      setState(AppState.PICKING_TOPIC);
    }
  };

  const handleAddWord = async (word: string) => {
    const normalizedWord = word.trim().replace(/[.,!?;:()]/g, "");
    if (!normalizedWord || normalizedWord.length < 2) return;
    
    if (vocab.some(v => v.word.toLowerCase() === normalizedWord.toLowerCase())) {
      showToast(`"${normalizedWord}" is already in your bank.`);
      return;
    }
    
    const tempId = Date.now().toString();
    const newWord: VocabularyWord = {
      id: tempId,
      word: normalizedWord,
      partOfSpeech: '...',
      chinese: '...',
      english: 'Fetching definition...',
      example: '',
      phrases: [],
      deformations: [],
      addedAt: new Date().toISOString()
    };
    
    setVocab(prev => [...prev, newWord]);
    showToast(`Added "${normalizedWord}" to bank.`);
    
    try {
      const details = await getWordDefinition(normalizedWord);
      setVocab(prev => prev.map(v => v.id === tempId ? { ...v, ...details } : v));
    } catch (error) {
      setVocab(prev => prev.map(v => v.id === tempId ? { ...v, english: 'Could not fetch definition.' } : v));
    }
  };

  const handleRemoveWord = (id: string) => {
    setVocab(prev => prev.filter(v => v.id !== id));
  };

  const resetToHome = () => {
    setState(AppState.PICKING_TOPIC);
    setCurrentArticle(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}

      <div className="lg:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
        <h1 className="font-bold text-indigo-600">Daily Lexis</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block fixed inset-0 z-40 lg:relative lg:inset-auto bg-slate-900/50 backdrop-blur-sm lg:bg-transparent`}>
        <div className="flex flex-col h-full bg-white lg:bg-transparent overflow-y-auto w-full max-w-sm lg:max-w-none">
          <SidebarLeft history={history} />
        </div>
      </div>

      <main className="flex-1 bg-[#fdfdfd] min-h-screen relative overflow-x-hidden">
        {state === AppState.PICKING_TOPIC && (
          <TopicPicker 
            onSelect={handleTopicSelection} 
            onSelectHeadline={handleHeadlineSelection}
            headlines={headlines} 
            loadingHeadlines={loadingHeadlines} 
          />
        )}

        {state === AppState.LOADING_ARTICLE && (
          <div className="flex flex-col items-center justify-center h-screen animate-in fade-in duration-500 p-8 text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating 1,000-Word Study Material</h2>
            <p className="text-slate-500 font-medium max-w-sm">
               Synthesizing global perspectives and complex language patterns for your daily session...
            </p>
          </div>
        )}

        {state === AppState.READING && currentArticle && (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <button 
                onClick={resetToHome}
                className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                &larr; BACK TO HUB
              </button>
              <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                1,000 WORD STUDY MODE
              </div>
            </div>
            <ArticleReader 
              article={currentArticle} 
              onAddWord={handleAddWord} 
              knownWords={vocab.map(v => v.word)}
            />
          </div>
        )}
      </main>

      <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative inset-y-0 right-0 z-40 lg:inset-auto bg-white border-l shadow-2xl lg:shadow-none shrink-0`}>
         <SidebarRight words={vocab} onAddWord={handleAddWord} onRemoveWord={handleRemoveWord} />
      </div>
    </div>
  );
};

export default App;
