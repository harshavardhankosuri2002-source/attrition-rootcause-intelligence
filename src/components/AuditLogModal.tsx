import React, { useEffect, useState } from 'react';
import { X, History, Shield, Clock } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getAuditLog()
        .then(data => setLogs(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Audit & Governance Log</h2>
              <p className="text-xs text-slate-400">Verifiable trace of imports, modeling runs, scenarios, and queries</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Loading audit entries...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No audit events recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div key={index} className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[10px]">{log.user_role}</span>
                    </div>
                    <p className="text-slate-200">{log.details}</p>
                  </div>
                  <div className="text-slate-500 text-[10px] whitespace-nowrap pl-4 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center">
            <Shield className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Immutable in-memory session logging enabled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
