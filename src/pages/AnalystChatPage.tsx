import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  ShieldAlert,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { FilterCriteria } from '../types';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  citations?: any[];
  toolExecuted?: string;
}

interface AnalystChatPageProps {
  filters: FilterCriteria;
}

const SUGGESTED_QUERIES = [
  "What is our overall active headcount and historical attrition rate?",
  "Which departments show the highest historical turnover rate?",
  "Is frequent overtime significantly associated with employee departures?",
  "What is the odds ratio for employees below market salary parity?",
  "What is our held-out model ROC-AUC and leading predictive features?",
  "What is the estimated cost of our historical departures?"
];

export const AnalystChatPage: React.FC<AnalystChatPageProps> = ({ filters }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: (
        "### RetentionIQ Grounded Workforce Intelligence Analyst\n\n" +
        "Hello. I am your evidence-grounded workforce analyst. Every quantitative claim I state is executed through server-side analytical routines directly on the active dataset.\n\n" +
        "- I cite exact numerators, denominators, and sample sizes.\n" +
        "- I strictly distinguish between descriptive facts, predictive estimates, and hypotheses.\n" +
        "- I will never invent numbers or claim unsupported causality.\n\n" +
        "Feel free to ask a question below or click one of the suggested prompts."
      )
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askAnalyst(q, filters, []);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: res.answer,
        citations: res.citations,
        toolExecuted: res.tool_executed
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ **Analytical Execution Error**: ${err.message || 'Unable to process query.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "Conversation history cleared. Ask any question regarding the active workforce dataset."
      }
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Safeguard Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>
            <strong>Grounded Execution Engine:</strong> Responses are grounded in live calculations on the active dataset without simulated metrics.
          </span>
        </div>
        <button
          onClick={handleClearHistory}
          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-white transition"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium">Quick Questions:</span>
        {SUGGESTED_QUERIES.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="card-panel p-5 min-h-[440px] max-h-[600px] overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 text-xs leading-relaxed ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
            )}

            <div
              className={`p-4 rounded-xl max-w-2xl ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-850 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Message Body with Markdown formatting support */}
              <div className="space-y-2 whitespace-pre-line">
                {msg.text}
              </div>

              {/* Verified Citations Badge */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] space-y-1">
                  <span className="text-slate-400 font-semibold block flex items-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
                    Verified Mathematical Citations:
                  </span>
                  {msg.citations.map((cite: any, ci: number) => (
                    <div key={ci} className="p-1.5 rounded bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-slate-300">
                      {cite.source}: {cite.factor || cite.metric || cite.dimension} → {cite.value || cite.odds_ratio || cite.overall_rate || cite.roc_auc} ({cite.numerator_denominator || cite.sample_size || ''})
                    </div>
                  ))}
                </div>
              )}

              {msg.toolExecuted && (
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  Engine Tool Executed: {msg.toolExecuted}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-3 bg-slate-850 rounded-xl max-w-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Querying active dataset & running statistical routines...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Ask an analytical question about retention rates, drivers, models, or costs..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center space-x-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
