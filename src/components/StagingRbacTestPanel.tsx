import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Server, 
  UserCheck, 
  RefreshCw, 
  Eye, 
  Play,
  User,
  Info
} from 'lucide-react';
import { 
  runAccountRbacTest, 
  runFullStagingRbacSuite, 
  verifyStagingTarget, 
  FullRbacSuiteSummary, 
  AccountRbacTestSummary,
  REQUIRED_STAGING_PROJECT_ID 
} from '../lib/staging-rbac-test-runner';
import { stagingAuth } from '../lib/firebase-staging';

export interface StagingRbacTestPanelProps {
  onClose?: () => void;
}

export function StagingRbacTestPanel({ onClose }: StagingRbacTestPanelProps) {
  const [currentAuthUser, setCurrentAuthUser] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAccountTesting, setActiveAccountTesting] = useState<string | null>(null);

  // Account passwords for running tests
  const [superadminPass, setSuperadminPass] = useState('Staging@Test1234');
  const [schaPass, setSchaPass] = useState('Staging@Test1234');
  const [schbPass, setSchbPass] = useState('Staging@Test1234');

  // Results state
  const [suiteSummary, setSuiteSummary] = useState<FullRbacSuiteSummary | null>(null);
  const [individualResults, setIndividualResults] = useState<Record<string, AccountRbacTestSummary>>({});

  useEffect(() => {
    const unsub = stagingAuth.onAuthStateChanged((user) => {
      setCurrentAuthUser(user ? user.email : null);
    });
    return () => unsub();
  }, []);

  // Run single account test
  const handleTestAccount = async (email: string, pass: string, role: string) => {
    setActiveAccountTesting(email);
    setIsRunning(true);
    try {
      const res = await runAccountRbacTest(email, pass.trim() || undefined, role);
      setIndividualResults(prev => ({
        ...prev,
        [email]: res
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setIndividualResults(prev => ({
        ...prev,
        [email]: {
          accountEmail: email,
          accountRole: role,
          authStatus: 'AUTH_ERROR',
          authErrorMessage: msg,
          tests: [],
          overallStatus: 'FAIL'
        }
      }));
    } finally {
      setIsRunning(false);
      setActiveAccountTesting(null);
    }
  };

  // Run all 3 accounts
  const handleRunAllSuites = async () => {
    setIsRunning(true);
    setActiveAccountTesting('ALL');
    try {
      const summary = await runFullStagingRbacSuite({
        superadminPassword: superadminPass.trim() || undefined,
        adminSchaPassword: schaPass.trim() || undefined,
        adminSchbPassword: schbPass.trim() || undefined
      });
      setSuiteSummary(summary);
      const map: Record<string, AccountRbacTestSummary> = {};
      summary.accountSummaries.forEach(acc => {
        map[acc.accountEmail] = acc;
      });
      setIndividualResults(map);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSuiteSummary({
        verifiedProjectId: REQUIRED_STAGING_PROJECT_ID,
        isTargetVerified: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        accountSummaries: [],
        errorMessage: `Execution error: ${msg}`
      });
    } finally {
      setIsRunning(false);
      setActiveAccountTesting(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 text-slate-100 max-w-4xl mx-auto my-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">
                Staging READ-ONLY RBAC Test Suite
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                0 Writes • Read-Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Validates multi-tenant isolation across schools and student records on project <code className="text-indigo-300 font-mono">web-1e643</code>.
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

      {/* Target & Safety Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Server className="w-4 h-4 text-indigo-400" /> Target Staging
          </div>
          <div className="text-sm font-mono text-emerald-400 font-bold mt-1">
            web-1e643
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Database: (default)</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" /> Production Safety
          </div>
          <div className="text-sm font-mono text-slate-300 mt-1">
            gen-lang-client-0627643856
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Isolated / Zero Access
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-400" /> Active Session
          </div>
          <div className="text-xs font-mono text-slate-200 mt-1 truncate">
            {currentAuthUser || 'Unauthenticated'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {currentAuthUser ? 'Authenticated via Auth SDK' : 'Provide password below'}
          </div>
        </div>
      </div>

      {/* Global Action Button */}
      <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Execute Complete RBAC Matrix (3 Accounts, 9 Read Tests)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tests Super Admin universal read, SCH-A tenant isolation, and SCH-B cross-school block.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunAllSuites}
          disabled={isRunning}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all"
        >
          {isRunning && activeAccountTesting === 'ALL' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Full Suite...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run All 3 RBAC Test Suites
            </>
          )}
        </button>
      </div>

      {/* Account Test Cards (3 Test Accounts) */}
      <div className="space-y-4 mb-6">
        {/* ========================================================================= */}
        {/* ACCOUNT 1: superadmin@staging.internal */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-sm">
                    superadmin@staging.internal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                    ROLE: super_admin
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Expected: Can read <strong className="text-slate-300">STU-A-101</strong>, <strong className="text-slate-300">STU-A-102</strong>, and <strong className="text-slate-300">STU-B-101</strong> (Universal Read Access).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={superadminPass}
                onChange={(e) => setSuperadminPass(e.target.value)}
                placeholder="Account password"
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono w-36 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleTestAccount('superadmin@staging.internal', superadminPass, 'super_admin')}
                disabled={isRunning}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isRunning && activeAccountTesting === 'superadmin@staging.internal' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                Test Account 1
              </button>
            </div>
          </div>

          {individualResults['superadmin@staging.internal'] && (
            <TestResultsList summary={individualResults['superadmin@staging.internal']} />
          )}
        </div>

        {/* ========================================================================= */}
        {/* ACCOUNT 2: admin.scha@staging.internal */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-sm">
                    admin.scha@staging.internal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    ROLE: school_admin (SCH-A)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Expected: Can read <strong className="text-slate-300">STU-A-101</strong> & <strong className="text-slate-300">STU-A-102</strong>. <span className="text-rose-300 font-semibold">CANNOT read STU-B-101</span> (Cross-school block).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={schaPass}
                onChange={(e) => setSchaPass(e.target.value)}
                placeholder="Account password"
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono w-36 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleTestAccount('admin.scha@staging.internal', schaPass, 'school_admin (SCH-A)')}
                disabled={isRunning}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isRunning && activeAccountTesting === 'admin.scha@staging.internal' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                Test Account 2
              </button>
            </div>
          </div>

          {individualResults['admin.scha@staging.internal'] && (
            <TestResultsList summary={individualResults['admin.scha@staging.internal']} />
          )}
        </div>

        {/* ========================================================================= */}
        {/* ACCOUNT 3: admin.schb@staging.internal */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                3
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-sm">
                    admin.schb@staging.internal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    ROLE: school_admin (SCH-B)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Expected: Can read <strong className="text-slate-300">STU-B-101</strong>. <span className="text-rose-300 font-semibold">CANNOT read STU-A-101 or STU-A-102</span> (Cross-school block).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={schbPass}
                onChange={(e) => setSchbPass(e.target.value)}
                placeholder="Account password"
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono w-36 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleTestAccount('admin.schb@staging.internal', schbPass, 'school_admin (SCH-B)')}
                disabled={isRunning}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isRunning && activeAccountTesting === 'admin.schb@staging.internal' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                Test Account 3
              </button>
            </div>
          </div>

          {individualResults['admin.schb@staging.internal'] && (
            <TestResultsList summary={individualResults['admin.schb@staging.internal']} />
          )}
        </div>
      </div>

      {/* Footer Audit Notice */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
        <span>🔒 <strong>Pure Read-Only:</strong> Calls only <code className="font-mono text-slate-300">getDoc()</code>. Zero document mutations.</span>
        <span>Firestore Target: <code className="font-mono text-indigo-300">web-1e643/(default)</code></span>
      </div>
    </div>
  );
}

/**
 * Sub-component to render individual test results and profile audit for an account
 */
function TestResultsList({ summary }: { summary: AccountRbacTestSummary }) {
  if (summary.authStatus === 'AUTH_ERROR') {
    return (
      <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Authentication Failed</div>
          <div className="mt-0.5 opacity-90">{summary.authErrorMessage}</div>
        </div>
      </div>
    );
  }

  if (summary.authStatus === 'ANONYMOUS') {
    return (
      <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-lg text-amber-300 text-xs flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Not Authenticated As {summary.accountEmail}</div>
          <div className="mt-0.5 opacity-90">{summary.authErrorMessage}</div>
        </div>
      </div>
    );
  }

  const audit = summary.userProfileAudit;

  return (
    <div className="space-y-3 mt-3">
      {/* User Profile Document Audit Box */}
      {audit && (
        <div className={`p-3 rounded-lg border text-xs ${
          audit.exists && audit.status === 'active' && audit.role
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center justify-between font-semibold mb-1.5">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Auth Profile Audit: <code className="font-mono text-slate-200">{audit.docPath}</code>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              audit.exists ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {audit.exists ? 'DOCUMENT EXISTS' : 'DOCUMENT MISSING'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-2 font-mono">
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Auth UID:</span>
              <span className="text-slate-200 truncate block" title={audit.authUid}>{audit.authUid}</span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Role in Firestore:</span>
              <span className={audit.role === 'school_admin' || audit.role === 'super_admin' ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {audit.role || 'MISSING'}
              </span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Status in Firestore:</span>
              <span className={audit.status === 'active' ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {audit.status || 'MISSING'}
              </span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SchoolId in Firestore:</span>
              <span className={audit.schoolId ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {audit.schoolId || 'MISSING/NULL'}
              </span>
            </div>
          </div>

          {audit.error && (
            <div className="mt-2 text-rose-300 text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{audit.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Tests outcome */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-medium">
          <span>Target Document &amp; Expected Rule</span>
          <span>Status &amp; Firebase Response</span>
        </div>

        {summary.tests.map((test, idx) => (
          <div
            key={`${test.docPath}-${idx}`}
            className="flex items-center justify-between bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg text-xs"
          >
            <div className="flex items-center gap-2.5">
              {test.testStatus === 'PASS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div>
                <span className="font-mono text-slate-200 font-medium">
                  {test.docPath}
                </span>
                <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  EXPECTED: {test.expectedAccess}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              {test.firebaseErrorCode && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-[10px] border border-slate-700">
                  {test.firebaseErrorCode}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  test.testStatus === 'PASS'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {test.testStatus}
              </span>
              <span className="text-slate-400 text-[11px] max-w-xs truncate hidden md:inline" title={test.details}>
                {test.details}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
