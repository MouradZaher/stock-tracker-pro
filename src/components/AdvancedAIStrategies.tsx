import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  AlertTriangle, 
  Map, 
  Scale, 
  Globe, 
  Zap,
  TrendingDown,
  ChevronRight,
  Loader2,
  ExternalLink,
  Target
} from 'lucide-react';
import { advancedAIService } from '../services/advancedAIService';
import type { AIStrategyResult } from '../services/advancedAIService';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

const AdvancedAIStrategies: React.FC = () => {
  const [activeStrategy, setActiveStrategy] = useState<AIStrategyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const strategies = [
    {
      id: 'hedging',
      title: 'Portfolio Hedging',
      icon: <ShieldAlert className="text-emerald-500" size={24} />,
      description: 'Design efficient hedges using options and inverse ETFs.',
      color: 'emerald'
    },
    {
      id: 'institutional',
      title: 'Institutional Flow',
      icon: <Users className="text-blue-500" size={24} />,
      description: 'Analyze 13F data and top hedge fund accumulation.',
      color: 'blue'
    },
    {
      id: 'dividend',
      title: 'Dividend Danger',
      icon: <AlertTriangle className="text-red-500" size={24} />,
      description: 'Identify yield traps and high-probability dividend cuts.',
      color: 'red'
    },
    {
      id: 'correlation',
      title: 'Crisis Correlation',
      icon: <Map className="text-orange-500" size={24} />,
      description: 'Find unusual asset correlations and normalization trades.',
      color: 'orange'
    },
    {
      id: 'sentiment',
      title: 'Sentiment Arbitrage',
      icon: <Scale className="text-purple-500" size={24} />,
      description: 'Search for stocks where sentiment diverges from fundamentals.',
      color: 'purple'
    },
    {
      id: 'macro',
      title: 'Top-Down Macro',
      icon: <Globe className="text-cyan-500" size={24} />,
      description: 'Inflation, GDP, and sector outperformance analysis.',
      color: 'cyan'
    },
    {
      id: 'squeeze',
      title: 'Short Squeeze',
      icon: <Zap className="text-yellow-500" size={24} />,
      description: 'High short interest screener with upcoming catalysts.',
      color: 'yellow'
    }
  ];

  const handleRunStrategy = async (id: string) => {
    setIsLoading(true);
    soundService.playTap();
    
    try {
      let result: AIStrategyResult;
      switch (id) {
        case 'hedging': result = await advancedAIService.getHedgingStrategy('SPY'); break;
        case 'institutional': result = await advancedAIService.getInstitutionalPositioning(); break;
        case 'dividend': result = await advancedAIService.getDividendDangerRadar(); break;
        case 'correlation': result = await advancedAIService.getCrisisCorrelationMap(); break;
        case 'sentiment': result = await advancedAIService.getSentimentArbitrage(); break;
        case 'macro': result = await advancedAIService.getTopDownMacro(); break;
        case 'squeeze': result = await advancedAIService.getShortSqueezeScreener(); break;
        default: throw new Error('Unknown strategy');
      }
      
      setActiveStrategy(result);
      soundService.playSuccess();
      toast.success(`${result.title} Analysis Complete`);
    } catch (error) {
       toast.error("Failed to run AI strategy");
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    // Simple markdown-ish formatter
    return content.split('\n').map((line, i) => {
      if (line.startsWith('###')) {
        return <h3 key={i} className="text-xl font-bold mt-4 mb-2 text-white">{line.replace('###', '')}</h3>;
      }
      if (line.startsWith('*') || line.startsWith('-')) {
        return <li key={i} className="ml-4 text-gray-300 mb-1">{line.substring(2)}</li>;
      }
      if (line.match(/^\d\./)) {
        return <div key={i} className="ml-4 text-gray-300 mb-2 font-medium"><span className="text-accent mr-2">{line.split('.')[0]}.</span>{line.split('.').slice(1).join('.')}</div>;
      }
      return <p key={i} className="text-gray-400 mb-2 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="advanced-strategies-container mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Target className="text-accent" size={24} />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Tactical Alpha Command</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {strategies.map((strat) => (
          <div 
            key={strat.id}
            className="glass-card hover:border-accent group cursor-pointer transition-all duration-300 p-5 flex flex-col justify-between"
            onClick={() => handleRunStrategy(strat.id)}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-${strat.color}-500/10 border border-${strat.color}-500/20`}>
                  {strat.icon}
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-accent group-hover:translate-x-1 transition-all" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{strat.title}</h3>
              <p className="text-sm text-gray-400 leading-snug">{strat.description}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Analysis Mode</span>
              <span className="text-[10px] font-black text-accent uppercase">Run Scan</span>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-accent mb-4" size={48} />
            <div className="text-xl font-bold animate-pulse">Running Neural Market Simulation...</div>
            <div className="text-sm text-gray-400 mt-2">Accessing institutional data streams</div>
        </div>
      )}

      {activeStrategy && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-accent/30">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-accent/5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">AI Intelligence Report</span>
                </div>
                <h2 className="text-2xl font-black text-white">{activeStrategy.title}</h2>
              </div>
              <button 
                onClick={() => setActiveStrategy(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <TrendingDown size={24} style={{ transform: 'rotate(135deg)' }} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
               <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 italic text-gray-300">
                 "{activeStrategy.summary}"
               </div>
               
               <div className="strategy-content">
                 {renderContent(activeStrategy.content)}
               </div>

               <div className="mt-8 pt-6 border-t border-white/10">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ExternalLink size={12} /> Data Sources & Verification
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {activeStrategy.sources.map((source, i) => (
                      <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-medium border border-white/10 text-gray-400">
                        {source}
                      </span>
                    ))}
                 </div>
               </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/40 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-500 uppercase">AI Confidence</span>
                   <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${activeStrategy.confidence}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-accent">{activeStrategy.confidence}%</span>
                   </div>
                 </div>
               </div>
               <button 
                onClick={() => setActiveStrategy(null)}
                className="btn btn-primary px-8"
               >
                 Acknowledge Report
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAIStrategies;
