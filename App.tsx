import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Brain, ArrowLeft, Trash2, MoreVertical, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Deck, Flashcard, ViewState, GeneratedCardData } from './types';
import { generateFlashcardsFromTopic, explainTerm } from './services/geminiService';
import CardFlip from './components/CardFlip';
import { Modal } from './components/Modal';
import Markdown from 'react-markdown';

// --- Helper Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DECKS: Deck[] = [
  {
    id: 'demo-1',
    title: 'Common Greetings',
    description: 'Basic English phrases for meeting people.',
    createdAt: Date.now(),
    cards: [
      { id: 'c1', front: 'How are you?', back: 'Bạn khỏe không?', example: 'Hi John, how are you today?', mastered: false },
      { id: 'c2', front: 'Nice to meet you', back: 'Rất vui được gặp bạn', example: 'I am Sarah. Nice to meet you.', mastered: false },
    ]
  }
];

// --- Main App Component ---
export default function App() {
  // State
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('gemini-flashcards-decks');
    return saved ? JSON.parse(saved) : INITIAL_DECKS;
  });
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  
  // Create/Edit Deck Modal State
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // AI Generation Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Study Mode State
  const [studyCardIndex, setStudyCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('gemini-flashcards-decks', JSON.stringify(decks));
  }, [decks]);

  // Derived State
  const activeDeck = decks.find(d => d.id === activeDeckId);

  // --- Handlers ---

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    const newDeck: Deck = {
      id: generateId(),
      title: newDeckTitle,
      description: newDeckDesc,
      cards: [],
      createdAt: Date.now()
    };
    setDecks([newDeck, ...decks]);
    setNewDeckTitle('');
    setNewDeckDesc('');
    setIsDeckModalOpen(false);
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this deck?')) {
      setDecks(decks.filter(d => d.id !== id));
      if (activeDeckId === id) {
        setView('DASHBOARD');
        setActiveDeckId(null);
      }
    }
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeckId || !aiTopic.trim()) return;
    
    setIsGenerating(true);
    try {
      const cardsData = await generateFlashcardsFromTopic(aiTopic);
      const newCards: Flashcard[] = cardsData.map(c => ({
        id: generateId(),
        front: c.term,
        back: c.definition,
        example: c.example,
        mastered: false
      }));

      setDecks(prev => prev.map(deck => {
        if (deck.id === activeDeckId) {
          return { ...deck, cards: [...deck.cards, ...newCards] };
        }
        return deck;
      }));
      
      setAiTopic('');
      setIsAiModalOpen(false);
    } catch (err) {
      alert("Failed to generate cards. Please check your connection and API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startStudy = () => {
    if (activeDeck && activeDeck.cards.length > 0) {
      setStudyCardIndex(0);
      setIsCardFlipped(false);
      setAiExplanation(null);
      setView('STUDY_MODE');
    }
  };

  const handleExplain = async () => {
    if (!activeDeck) return;
    const currentCard = activeDeck.cards[studyCardIndex];
    
    setAiExplanation(null); // Clear previous
    setIsExplaining(true);
    
    // Open modal immediately to show loading state
    
    const explanation = await explainTerm(currentCard.front, `Learning deck: ${activeDeck.title}`);
    setAiExplanation(explanation);
    setIsExplaining(false);
  };

  const nextCard = () => {
    if (!activeDeck) return;
    if (studyCardIndex < activeDeck.cards.length - 1) {
      setIsCardFlipped(false);
      setAiExplanation(null);
      setTimeout(() => setStudyCardIndex(prev => prev + 1), 150); // slight delay for flip reset
    } else {
        // Finished
        alert("Great job! You've reached the end of the deck.");
        setView('DECK_VIEW');
    }
  };

  const prevCard = () => {
    if (studyCardIndex > 0) {
      setIsCardFlipped(false);
      setAiExplanation(null);
      setTimeout(() => setStudyCardIndex(prev => prev - 1), 150);
    }
  };

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Brain className="text-indigo-600" size={32} />
            Gemini Flashcards
          </h1>
          <p className="text-slate-500 mt-2">Supercharge your English vocabulary with AI.</p>
        </div>
        <button 
          onClick={() => setIsDeckModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 font-medium"
        >
          <Plus size={20} />
          New Deck
        </button>
      </header>

      {decks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 text-lg">No decks yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div 
              key={deck.id}
              onClick={() => { setActiveDeckId(deck.id); setView('DECK_VIEW'); }}
              className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <button 
                  onClick={(e) => handleDeleteDeck(deck.id, e)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{deck.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{deck.description || "No description"}</p>
              <div className="flex items-center text-xs text-slate-400 font-medium">
                <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                  {deck.cards.length} cards
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDeckView = () => {
    if (!activeDeck) return null;
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button 
          onClick={() => setView('DASHBOARD')}
          className="mb-6 flex items-center text-slate-500 hover:text-indigo-600 transition-colors gap-2 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{activeDeck.title}</h1>
              <p className="text-slate-500">{activeDeck.description}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors font-semibold"
              >
                <Sparkles size={18} />
                Generate Cards
              </button>
              <button 
                onClick={startStudy}
                disabled={activeDeck.cards.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 font-semibold"
              >
                <Brain size={18} />
                Study Now
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Cards in this deck</h2>
        {activeDeck.cards.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
            No cards yet. Click "Generate Cards" to use AI or add manually (feature coming soon).
          </div>
        ) : (
          <div className="grid gap-3">
            {activeDeck.cards.map((card, idx) => (
              <div key={card.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                 <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-xs text-slate-500 font-bold">
                        {idx + 1}
                    </span>
                    <div>
                        <p className="font-bold text-slate-800">{card.front}</p>
                        <p className="text-sm text-slate-500">{card.back}</p>
                    </div>
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 text-xs text-indigo-500 font-medium px-3 py-1 bg-indigo-50 rounded-full">
                    {card.example.substring(0, 30)}...
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStudyMode = () => {
    if (!activeDeck) return null;
    const currentCard = activeDeck.cards[studyCardIndex];

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
           <button 
             onClick={() => setView('DECK_VIEW')}
             className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
           >
             <ArrowLeft size={24} />
           </button>
           <div className="flex flex-col items-center">
             <h2 className="font-bold text-slate-800">{activeDeck.title}</h2>
             <span className="text-xs text-slate-500">
                Card {studyCardIndex + 1} of {activeDeck.cards.length}
             </span>
           </div>
           <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
           
           {/* Progress Bar */}
           <div className="w-full max-w-md h-1 bg-slate-200 rounded-full mb-8 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((studyCardIndex + 1) / activeDeck.cards.length) * 100}%` }}
              />
           </div>

           <CardFlip 
             front={currentCard.front}
             back={currentCard.back}
             example={currentCard.example}
             isFlipped={isCardFlipped}
             onFlip={() => setIsCardFlipped(!isCardFlipped)}
             onExplain={handleExplain}
           />

           <div className="mt-12 flex items-center gap-6">
              <button 
                onClick={prevCard}
                disabled={studyCardIndex === 0}
                className="p-4 rounded-full bg-white text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-200 disabled:opacity-50 transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              
              <button 
                onClick={nextCard}
                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
              >
                Next Card
              </button>
           </div>
        </div>

        {/* AI Explanation Modal (Simplified as an overlay here for Study Mode) */}
        {aiExplanation !== null && (
             <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/20 backdrop-blur-sm" onClick={() => setAiExplanation(null)}>
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <Sparkles size={20} />
                            <span>AI Explanation</span>
                        </div>
                        <button onClick={() => setAiExplanation(null)} className="text-slate-400 hover:text-slate-600">
                            <ArrowLeft size={20} className="rotate-180" /> {/* Close icon */}
                        </button>
                    </div>
                    <div className="prose prose-sm prose-indigo text-slate-600 max-h-[60vh] overflow-y-auto">
                        <Markdown>{aiExplanation}</Markdown>
                    </div>
                </div>
             </div>
        )}

        {isExplaining && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <div className="bg-white px-6 py-4 rounded-full shadow-xl flex items-center gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                    <span className="font-medium text-slate-700">Asking Gemini...</span>
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {view === 'DASHBOARD' && renderDashboard()}
      {view === 'DECK_VIEW' && renderDeckView()}
      {view === 'STUDY_MODE' && renderStudyMode()}

      {/* Create Deck Modal */}
      <Modal 
        isOpen={isDeckModalOpen} 
        onClose={() => setIsDeckModalOpen(false)} 
        title="Create New Deck"
      >
        <form onSubmit={handleCreateDeck} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deck Title</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g., Business English"
              value={newDeckTitle}
              onChange={e => setNewDeckTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-24 resize-none"
              placeholder="What is this deck about?"
              value={newDeckDesc}
              onChange={e => setNewDeckDesc(e.target.value)}
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsDeckModalOpen(false)}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Deck
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Generator Modal */}
      <Modal 
        isOpen={isAiModalOpen} 
        onClose={() => !isGenerating && setIsAiModalOpen(false)} 
        title="Generate with Gemini AI"
      >
        <form onSubmit={handleGenerateCards} className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="text-sm text-indigo-800 flex items-start gap-2">
               <Wand2 className="shrink-0 mt-0.5" size={16} />
               Gemini will generate 5 high-quality flashcards with Vietnamese definitions and English examples based on your topic.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
            <input 
              type="text" 
              required
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g., Cooking Vocabulary, IELTS Writing Task 2"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
            />
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              disabled={isGenerating}
              onClick={() => setIsAiModalOpen(false)}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2 disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Cards
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}