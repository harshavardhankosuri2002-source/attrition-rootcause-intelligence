import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setLoading(true);

    try {
      const preview = await api.uploadPreview(selected);
      setPreviewData(preview);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Dataset Ingestion & Validation</h2>
              <p className="text-xs text-slate-400">Upload CSV or Excel files with canonical schema mapping & sanity checks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 text-xs">
          {!previewData ? (
            <div>
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-850/50 hover:bg-slate-850 transition">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-200">Click to choose a file or drag & drop</span>
                <span className="text-slate-400 text-[11px] mt-1">Supports CSV, XLSX, XLS (Max 15MB)</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {loading && (
                <div className="mt-4 text-center text-slate-400 py-4">
                  Parsing and validating schema...
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-semibold text-white">{previewData.filename}</span>
                    <span className="text-slate-400 text-[10px] block">{previewData.row_count_preview} preview rows parsed</span>
                  </div>
                </div>
                <button onClick={handleReset} className="text-xs text-slate-400 hover:text-white underline">
                  Choose another file
                </button>
              </div>

              {/* Validation Status */}
              {previewData.validation_errors.length > 0 ? (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200">
                  <span className="font-semibold flex items-center mb-1">
                    <AlertCircle className="w-4 h-4 text-rose-400 mr-1" />
                    Validation Failed (Import Blocked)
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {previewData.validation_errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200">
                  <span className="font-semibold flex items-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" />
                    Schema Validated (Ready for Ingestion)
                  </span>
                  <p className="text-[11px]">All required canonical fields mapped successfully.</p>
                </div>
              )}

              {/* Warnings */}
              {previewData.validation_warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200">
                  <span className="font-semibold flex items-center mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mr-1" />
                    Data Quality Warnings
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {previewData.validation_warnings.map((warn: string, i: number) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Column Mapping Preview */}
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Canonical Column Mapping</span>
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-850 border border-slate-800">
                  {Object.entries(previewData.mapped_columns).map(([canon, uploaded]: [any, any]) => (
                    <div key={canon} className="flex justify-between items-center px-2 py-1 rounded bg-slate-900 text-[11px]">
                      <span className="text-slate-400 font-mono">{canon}</span>
                      <span className="text-blue-300 font-medium">← {uploaded}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Sample Ingested Rows</span>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                      <tr>
                        {Object.keys(previewData.preview_rows[0] || {}).slice(0, 6).map((k) => (
                          <th key={k} className="p-2 font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {previewData.preview_rows.slice(0, 3).map((row: any, i: number) => (
                        <tr key={i}>
                          {Object.values(row).slice(0, 6).map((val: any, j: number) => (
                            <td key={j} className="p-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Cancel
          </button>
          {previewData && previewData.can_import && (
            <button
              onClick={() => {
                onImportComplete();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
            >
              Confirm Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
