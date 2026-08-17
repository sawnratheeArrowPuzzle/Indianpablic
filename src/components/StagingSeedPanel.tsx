import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  Server, 
  Lock, 
  FileCheck, 
  Layers,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  LogIn
} from 'lucide-react';
import { 
  verifyStagingTarget, 
  executeStagingSeed, 
  StagingSeedSummary, 
  REQUIRED_STAGING_PROJECT_ID 
} from '../lib/staging-seed-executor';
import { stagingAuth } from '../lib/firebase-staging';

export interface StagingSeedPanelProps {
  onClose?: () => void;
}

export function StagingSeedPanel({ onClose }: StagingSeedPanelProps) {
  const [targetStatus, setTargetStatus] = useState<{
    verified: boolean;
    projectId: string;
    message?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [seedSummary, setSeedSummary] = useState<StagingSeedSummary | null>(null);

  // Staging Admin Auth fields
  const [adminEmail, setAdminEmail] = useState('superadmin@staging.internal');
  const [adminPassword, setAdminPassword] = useState('');
  const [currentAuthUser, setCurrentAuthUser] = useState<string | null>(null);

  useEffect(() => {
    const unsub = stagingAuth.onAuthStateChanged((user) => {
      setCurrentAuthUser(user ? user.email : null);
    });
    return () => unsub();
  }, []);

  const handleVerifyTarget = () => {
    const res = verifyStagingTarget();
    setTargetStatus({
      verified: res.isVerified,
      projectId: res.projectId,
      message: res.error || `Target verified strictly as '${REQUIRED_STAGING_PROJECT_ID}'. Production project is 100% isolated.`
    });
  };

  const handleRunSeed = async () => {
    setIsLoading(true);
    try {
      const summary = await executeStagingSeed({
        adminEmail: adminEmail.trim() || undefined,
        adminPassword: adminPassword.trim() || undefined
      });
      setSeedSummary(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSeedSummary({
        verifiedProjectId: REQUIRED_STAGING_PROJECT_ID,
        isTargetVerified: false,
        totalPlanned: 8,
        createdCount: 0,
        skippedCount: 0,
        failedCount: 8,
        authContext: 'Execution Exception',
        results: [],
        errorMessage: `Execution error: ${msg}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 text-slate-100 max-w-3xl mx-auto my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Staging One-Click Setup
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                web-1e643
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly isolated staging demo data initialization. Idempotent & non-destructive.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {/* Target Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex items-start gap-3">
          <Server className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Target Project ID</div>
            <div className="text-sm font-mono text-emerald-400 font-bold mt-0.5">
              web-1e643
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Configuration: <code className="text-slate-300 font-mono">firebase-staging-config.json</code>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Production Isolation</div>
            <div className="text-sm font-mono text-slate-200 mt-0.5">
              gen-lang-client-0627643856
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Untouched / Zero Writes
            </div>
          </div>
        </div>
      </div>

      {/* Auth Context Banner */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-300">Staging Auth Status:</span>
          {currentAuthUser ? (
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> {currentAuthUser}
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              Anonymous (Unauthenticated)
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          Firestore rules require an authorized staging admin for collection writes
        </span>
      </div>

      {/* Optional Auth Credentials for Staging Firestore Rules */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3.5 mb-5">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <LogIn className="w-3.5 h-3.5 text-indigo-400" />
          Staging Admin Authentication (Required for Firestore Write Permissions)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Staging Admin Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="superadmin@staging.internal"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Staging Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter staging test password"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Target Verification Message */}
      {targetStatus && (
        <div className={`p-3.5 rounded-lg border mb-5 text-sm flex items-start gap-3 ${
          targetStatus.verified 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}>
          {targetStatus.verified ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold">
              {targetStatus.verified ? 'Staging Target Verified' : 'Verification Alert'}
            </div>
            <div className="text-xs mt-0.5 opacity-90">{targetStatus.message}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleVerifyTarget}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 text-slate-200 font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <Shield className="w-4 h-4 text-indigo-400" />
          Verify Staging Target
        </button>

        <button
          type="button"
          onClick={handleRunSeed}
          disabled={isLoading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 border border-emerald-500/50 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/30"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              Seeding web-1e643...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 text-emerald-200" />
              Seed Staging Demo Data
            </>
          )}
        </button>
      </div>

      {/* Real Execution Results */}
      {seedSummary && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                Execution Outcome (Target: {seedSummary.verifiedProjectId})
              </h3>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Auth Context: <span className="text-slate-300 font-mono">{seedSummary.authContext}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Created: {seedSummary.createdCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                Skipped: {seedSummary.skippedCount}
              </span>
              {seedSummary.failedCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                  Failed: {seedSummary.failedCount}
                </span>
              )}
            </div>
          </div>

          {seedSummary.errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-lg mb-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{seedSummary.errorMessage}</div>
            </div>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {seedSummary.results.map((res, idx) => (
              <div 
                key={`${res.collection}-${res.docId}-${idx}`}
                className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {res.action === 'CREATED' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {res.action === 'EXISTS_SKIPPED' && (
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  {res.action === 'FAILED' && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-mono text-slate-300 font-medium">
                    {res.collection}/{res.docId}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-right">
                  {res.errorCode && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-[10px] border border-slate-700">
                      {res.errorCode}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                    res.action === 'CREATED' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : res.action === 'EXISTS_SKIPPED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {res.action}
                  </span>
                  <span className="text-slate-400 text-[11px] max-w-xs truncate hidden sm:inline" title={res.details}>
                    {res.details}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>🛡️ Idempotent Execution: Existing documents are never overwritten.</span>
            <span>Auth accounts &amp; `users` collection untouched.</span>
          </div>
        </div>
      )}
    </div>
  );
}
