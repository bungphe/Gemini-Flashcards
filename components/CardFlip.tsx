import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';

interface CardFlipProps {
  front: string;
  back: string;
  example: string;
  isFlipped: boolean;
  onFlip: () => void;
  onExplain?: () => void;
}

const CardFlip: React.FC<CardFlipProps> = ({ front, back, example, isFlipped, onFlip, onExplain }) => {
  
  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div 
      className="relative w-full max-w-md h-96 perspective-1000 cursor-pointer group"
      onClick={onFlip}
    >
      <div 
        className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front Face */}
        <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col items-center justify-center backface-hidden">
          <span className="absolute top-4 left-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Term</span>
          <h2 className="text-4xl font-bold text-slate-800 text-center">{front}</h2>
          <button 
            onClick={(e) => handleSpeak(e, front)}
            className="mt-6 p-3 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="Listen"
          >
            <Volume2 size={24} />
          </button>
          
          <div className="absolute bottom-6 w-full flex justify-center text-slate-400 text-sm animate-pulse">
            Click to flip
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute w-full h-full bg-indigo-600 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 text-white">
          <span className="absolute top-4 left-4 text-xs font-semibold text-indigo-200 uppercase tracking-wider">Definition</span>
          
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <h3 className="text-2xl font-bold text-center mb-6">{back}</h3>
            
            <div className="w-full bg-indigo-700/50 p-4 rounded-xl">
              <p className="text-indigo-100 italic text-center text-lg">"{example}"</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
             <button 
                onClick={(e) => handleSpeak(e, example)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Listen to example"
              >
                <Volume2 size={20} />
              </button>
             {onExplain && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onExplain(); }}
                 className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
               >
                 <Sparkles size={16} />
                 Explain AI
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardFlip;