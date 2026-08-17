import React, { useState } from 'react';
import { X, Database, ShieldCheck, Layers } from 'lucide-react';
import { StagingSeedPanel } from './StagingSeedPanel';
import { StagingRbacTestPanel } from './StagingRbacTestPanel';

interface StagingSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StagingSeedModal({ isOpen, onClose }: StagingSeedModalProps) {
  const [activeTab, setActiveTab] = useState<'rbac_tests' | 'seed_overview'>('rbac_tests');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6">
        {/* Top Header & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('rbac_tests')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'rbac_tests'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              READ-ONLY RBAC Tests
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seed_overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'seed_overview'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Staging Seed &amp; Setup
            </button>
          </div>

          <button
            onClick={onClose}
            className="self-end sm:self-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'rbac_tests' ? (
          <StagingRbacTestPanel onClose={onClose} />
        ) : (
          <StagingSeedPanel onClose={onClose} />
        )}
      </div>
    </div>
  );
}
