import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package as PackageIcon,
  BookOpen,
  ShoppingBag,
  ShieldCheck,
  GitBranch,
  Percent,
  Wallet,
  ArrowDownToLine,
  Network,
  Trophy,
  BarChart3,
  Bell,
  Gift,
  MessageSquare,
  Globe,
  QrCode,
  Sliders,
  Lock,
  FileText,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Download,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { BrandLogo } from '../common/BrandLogo';
import {
  AdminPackagesManager,
  AdminCoursesAndMappingManager,
  AdminSettingsPanels,
  AdminCommunicationAndSecurity,
} from './AdminCatalogAndSettings';
import type { AdminOverviewResponse, UserProfile } from '../../types/savvvn';

type AdminTab =
  | 'dashboard'
  | 'members'
  | 'packages'
  | 'courses'
  | 'orders'
  | 'payments'
  | 'referrals'
  | 'commissions'
  | 'wallets'
  | 'withdrawals'
  | 'team'
  | 'leaderboard'
  | 'reports'
  | 'notifications'
  | 'offers'
  | 'support'
  | 'website_settings'
  | 'upi_settings'
  | 'commission_settings'
  | 'admin_security'
  | 'audit_logs';

interface AdminPanelProps {
  user: UserProfile;
  onOpenMemberDashboard: () => void;
  onGoPublicHome: () => void;
  onLogout: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  onOpenMemberDashboard,
  onGoPublicHome,
  onLogout,
}) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters & interactive modal states
  const [memberSearch, setMemberSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [payoutRefs, setPayoutRefs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lbRange, setLbRange] = useState<'days7' | 'days30' | 'allTime'>('allTime');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'packages', label: 'Packages', icon: <PackageIcon className="w-4 h-4" /> },
    { id: 'courses', label: 'Courses & Lessons', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    {
      id: 'payments',
      label: 'Payment Verification',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: data?.stats.pendingPaymentsCount || 0,
    },
    { id: 'referrals', label: 'Referral & Sales', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'commissions', label: 'Commission Mgmt', icon: <Percent className="w-4 h-4" /> },
    { id: 'wallets', label: 'Wallets', icon: <Wallet className="w-4 h-4" /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowDownToLine className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Network className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'offers', label: 'Offers', icon: <Gift className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'website_settings', label: 'Website Settings', icon: <Globe className="w-4 h-4" /> },
    { id: 'upi_settings', label: 'UPI Settings', icon: <QrCode className="w-4 h-4" /> },
    { id: 'commission_settings', label: 'Commission Settings', icon: <Sliders className="w-4 h-4" /> },
    { id: 'admin_security', label: 'Admin Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'audit_logs', label: 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
  ];

  const handleVerifyPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    setBusyId(paymentId);
    setError(null);
    try {
      await api.verifyPayment(paymentId, action, actionNotes[paymentId] || '');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleCommissionAction = async (id: string, action: 'approve' | 'reverse') => {
    setBusyId(id);
    setError(null);
    try {
      await api.commissionAction(id, action, actionNotes[id] || '');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Commission update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'paid' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      await api.withdrawalAction(id, action, {
        payoutReference: payoutRefs[id] || '',
        adminNote: actionNotes[id] || '',
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Withdrawal update failed');
    } finally {
      setBusyId(null);
    }
  };

  const exportReportsCsv = () => {
    if (!data) return;
    const rows = [
      ['OrderID', 'Date', 'Member', 'Email', 'Package', 'Amount', 'Status'],
      ...data.orders.map((o) => [
        o.id,
        o.createdAt,
        o.userName,
        o.userEmail,
        o.packageName,
        String(o.amount),
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savvvnlab-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSidebar = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#0B1E36] text-slate-200">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
        <button type="button" onClick={onGoPublicHome} className="cursor-pointer">
          <BrandLogo variant="sidebar" surface="dark" />
        </button>
        {isMobile && (
          <button type="button" onClick={() => setDrawerOpen(false)} className="p-1 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setDrawerOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              tab === item.id
                ? 'bg-[#6D28D9] text-white'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
            {item.badge ? (
              <span className="font-mono-num text-[11px] font-bold text-amber-300">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          type="button"
          onClick={onOpenMemberDashboard}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-teal-300 hover:bg-slate-800/60 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Member Dashboard</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/40 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <aside className="hidden lg:block lg:w-64 shrink-0">{renderSidebar(false)}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 h-full">{renderSidebar(true)}</div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 rounded-lg text-[#0B1E36] hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-[#0B1E36]">
              Admin · {navItems.find((i) => i.id === tab)?.label}
            </h1>
          </div>

          <div className="text-xs text-slate-600 truncate">
            Signed in as <strong className="text-[#0B1E36]">{user.email}</strong>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={loadData} className="text-xs font-semibold underline cursor-pointer">
                Reload
              </button>
            </div>
          )}

          {loading && !data ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <BrandLogo variant="full" className="mx-auto" />
              <div className="text-sm text-slate-500">Loading Admin Console...</div>
            </div>
          ) : data ? (
            <>
              {/* 1. DASHBOARD */}
              {tab === 'dashboard' && (
                <div className="space-y-6">
                  {!data.settings.upiId && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm text-amber-900">
                        <strong>Setup Required:</strong> Configure your official SavvvnLab UPI ID to enable package checkout.
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab('upi_settings')}
                        className="px-4 py-1.5 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Configure UPI
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Total Members</div>
                      <div className="font-mono-num text-2xl font-bold text-[#0B1E36] mt-1">
                        {data.stats.totalMembers}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Verified Gross Revenue</div>
                      <div className="font-mono-num text-2xl font-bold text-[#16A34A] mt-1">
                        ₹{data.stats.grossRevenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Pending UPI Verifications</div>
                      <div className="font-mono-num text-2xl font-bold text-amber-700 mt-1">
                        {data.stats.pendingPaymentsCount}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Pending Withdrawals</div>
                      <div className="font-mono-num text-2xl font-bold text-[#6D28D9] mt-1">
                        ₹{data.stats.pendingWithdrawalsAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                    <h2 className="font-display text-base font-bold text-[#0B1E36]">
                      7-Day Verified Revenue
                    </h2>
                    <div className="grid grid-cols-7 gap-2 pt-2 items-end h-36">
                      {data.salesSeries.map((d, i) => {
                        const max = Math.max(100, ...data.salesSeries.map((x) => x.amount));
                        const pct = Math.max(6, Math.round((d.amount / max) * 100));
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                            <div className="text-[10px] font-mono-num text-slate-500">
                              ₹{d.amount}
                            </div>
                            <div
                              className="w-full max-w-[36px] bg-[#0D9488] rounded-t"
                              style={{ height: `${pct}%` }}
                            />
                            <div className="text-xs text-slate-600">{d.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MEMBERS */}
              {tab === 'members' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Members ({data.members.length})
                    </h2>
                    <input
                      type="search"
                      placeholder="Search name, email, referral code..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm sm:w-72"
                    />
                  </div>

                  {data.members.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6">No registered members yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 pr-4">Member</th>
                            <th className="py-2 pr-4">Code</th>
                            <th className="py-2 pr-4">Packages</th>
                            <th className="py-2 pr-4">Wallet Bal</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.members
                            .filter((m) => {
                              const q = memberSearch.toLowerCase();
                              return (
                                !q ||
                                m.displayName.toLowerCase().includes(q) ||
                                m.email.toLowerCase().includes(q) ||
                                m.referralCode.toLowerCase().includes(q)
                              );
                            })
                            .map((m) => (
                              <tr key={m.uid} className="h-12">
                                <td className="py-2 pr-4">
                                  <div className="font-semibold text-[#0B1E36]">{m.displayName}</div>
                                  <div className="text-xs text-slate-500">{m.email}</div>
                                </td>
                                <td className="py-2 pr-4 font-mono-num text-xs">{m.referralCode}</td>
                                <td className="py-2 pr-4 font-mono-num text-xs">
                                  {m.unlockedPackageIds.length}
                                </td>
                                <td className="py-2 pr-4 font-mono-num font-semibold">
                                  ₹{m.wallet.availableBalance.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 text-xs font-semibold capitalize">
                                  <span
                                    className={
                                      m.status === 'active' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                    }
                                  >
                                    {m.status}
                                  </span>
                                </td>
                                <td className="py-2 text-right">
                                  {m.email !== 'sawnk340@gmail.com' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await api.updateMemberStatus(
                                          m.uid,
                                          m.status === 'active' ? 'suspended' : 'active'
                                        );
                                        await loadData();
                                      }}
                                      className="px-3 py-1 rounded border border-slate-300 text-xs font-semibold cursor-pointer"
                                    >
                                      {m.status === 'active' ? 'Suspend' : 'Activate'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. PACKAGES */}
              {tab === 'packages' && <AdminPackagesManager data={data} onReload={loadData} />}

              {/* 4. COURSES & LESSONS */}
              {tab === 'courses' && <AdminCoursesAndMappingManager data={data} onReload={loadData} />}

              {/* 5. ORDERS */}
              {tab === 'orders' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Orders ({data.orders.length})
                    </h2>
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    >
                      <option value="all">All Statuses</option>
                      <option value="awaiting_payment">Awaiting Payment</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  {data.orders.length === 0 ? (
                    <p className="text-sm text-slate-500">No orders placed yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 pr-4">Order ID</th>
                            <th className="py-2 pr-4">Buyer</th>
                            <th className="py-2 pr-4">Package</th>
                            <th className="py-2 pr-4">Amount</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.orders
                            .filter((o) => orderFilter === 'all' || o.status === orderFilter)
                            .map((o) => (
                              <tr key={o.id} className="h-12">
                                <td className="py-2 pr-4 font-mono-num text-xs">{o.id}</td>
                                <td className="py-2 pr-4 text-xs">
                                  <div className="font-semibold text-[#0B1E36]">{o.userName}</div>
                                  <div className="text-slate-500">{o.userEmail}</div>
                                </td>
                                <td className="py-2 pr-4 text-xs font-medium">{o.packageName}</td>
                                <td className="py-2 pr-4 font-mono-num font-semibold">
                                  ₹{o.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 text-xs font-semibold capitalize">
                                  {o.status.replace('_', ' ')}
                                </td>
                                <td className="py-2 text-right">
                                  {o.status === 'paid' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setBusyId(o.id);
                                        try {
                                          await api.refundOrder(o.id, 'Admin refund reversal');
                                          await loadData();
                                        } finally {
                                          setBusyId(null);
                                        }
                                      }}
                                      disabled={busyId === o.id}
                                      className="px-3 py-1 rounded border border-red-200 text-red-600 text-xs font-semibold cursor-pointer"
                                    >
                                      Refund & Reverse
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 6. PAYMENT VERIFICATION */}
              {tab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      UPI Payment Verification
                    </h2>
                    <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setPaymentFilter(st)}
                          className={`px-3 py-1 rounded-md text-xs font-medium capitalize cursor-pointer ${
                            paymentFilter === st ? 'bg-white text-[#0B1E36]' : 'text-slate-600'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {data.payments.filter((p) => paymentFilter === 'all' || p.status === paymentFilter)
                    .length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-500">
                      No payment submissions matching this filter.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.payments
                        .filter((p) => paymentFilter === 'all' || p.status === paymentFilter)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-5 justify-between"
                          >
                            <div className="flex gap-4 items-start">
                              <button
                                type="button"
                                onClick={() => setScreenshotModal(p.screenshotUrl)}
                                className="w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 relative group cursor-pointer"
                              >
                                <img
                                  src={p.screenshotUrl}
                                  alt={`UTR ${p.utr}`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs">
                                  <Eye className="w-4 h-4" />
                                </span>
                              </button>

                              <div className="space-y-1 text-xs">
                                <div className="font-mono-num font-bold text-sm text-[#0B1E36]">
                                  UTR: {p.utr} · ₹{p.amount.toLocaleString('en-IN')}
                                </div>
                                <div className="text-slate-700">
                                  {p.userName} ({p.userEmail})
                                </div>
                                <div className="text-slate-500">
                                  Order: {p.orderId} · Package: {p.packageName} · Paid to: {p.upiIdPaidTo}
                                </div>
                                <div className="font-semibold capitalize pt-1">
                                  Status:{' '}
                                  <span
                                    className={
                                      p.status === 'approved'
                                        ? 'text-[#16A34A]'
                                        : p.status === 'rejected'
                                        ? 'text-[#DC2626]'
                                        : 'text-amber-700'
                                    }
                                  >
                                    {p.status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {p.status === 'pending' && (
                              <div className="flex flex-col gap-2 md:w-72 shrink-0">
                                <input
                                  type="text"
                                  placeholder="Optional verification note / rejection reason"
                                  value={actionNotes[p.id] || ''}
                                  onChange={(e) =>
                                    setActionNotes({ ...actionNotes, [p.id]: e.target.value })
                                  }
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={busyId === p.id}
                                    onClick={() => handleVerifyPayment(p.id, 'approve')}
                                    className="flex-1 py-2 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Approve & Unlock
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === p.id}
                                    onClick={() => handleVerifyPayment(p.id, 'reject')}
                                    className="flex-1 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* 7. REFERRAL & SALES */}
              {tab === 'referrals' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Referral Attribution & Eligible Sales ({data.referrals.length})
                  </h2>
                  {data.referrals.length === 0 ? (
                    <p className="text-sm text-slate-500">No referral attributions recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 pr-4">Sponsor</th>
                            <th className="py-2 pr-4">Code</th>
                            <th className="py-2 pr-4">Referred Member</th>
                            <th className="py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.referrals.map((r) => (
                            <tr key={r.id} className="h-11">
                              <td className="py-2 pr-4 text-xs">
                                <span className="font-semibold text-[#0B1E36]">{r.sponsorName}</span>{' '}
                                <span className="text-slate-500">({r.sponsorEmail})</span>
                              </td>
                              <td className="py-2 pr-4 font-mono-num text-xs">{r.referralCode}</td>
                              <td className="py-2 pr-4 text-xs">
                                {r.referredName} ({r.referredEmail})
                              </td>
                              <td className="py-2 font-mono-num text-xs text-slate-500">
                                {new Date(r.createdAt).toLocaleDateString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 8. COMMISSION MANAGEMENT */}
              {tab === 'commissions' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Commission Ledger ({data.commissionLedger.length})
                  </h2>
                  {data.commissionLedger.length === 0 ? (
                    <p className="text-sm text-slate-500">No commissions generated yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 pr-4">Beneficiary</th>
                            <th className="py-2 pr-4">Sale / Buyer</th>
                            <th className="py-2 pr-4">Commission</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.commissionLedger.map((c) => (
                            <tr key={c.id} className="h-12">
                              <td className="py-2 pr-4 text-xs">
                                <div className="font-semibold text-[#0B1E36]">{c.beneficiaryName}</div>
                                <div className="text-slate-500">{c.beneficiaryEmail}</div>
                              </td>
                              <td className="py-2 pr-4 text-xs">
                                {c.packageName} (₹{c.saleAmount}) · {c.buyerName}
                              </td>
                              <td className="py-2 pr-4 font-mono-num font-bold text-[#0B1E36]">
                                ₹{c.commissionAmount.toLocaleString('en-IN')} ({c.commissionRate}%)
                              </td>
                              <td className="py-2 pr-4 text-xs font-semibold capitalize">
                                <span
                                  className={
                                    c.status === 'approved'
                                      ? 'text-[#16A34A]'
                                      : c.status === 'reversed'
                                      ? 'text-[#DC2626]'
                                      : 'text-amber-700'
                                  }
                                >
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-2 text-right space-x-2">
                                {c.status === 'pending' && (
                                  <button
                                    type="button"
                                    disabled={busyId === c.id}
                                    onClick={() => handleCommissionAction(c.id, 'approve')}
                                    className="px-3 py-1 rounded bg-[#16A34A] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Approve & Credit
                                  </button>
                                )}
                                {c.status !== 'reversed' && (
                                  <button
                                    type="button"
                                    disabled={busyId === c.id}
                                    onClick={() => handleCommissionAction(c.id, 'reverse')}
                                    className="px-3 py-1 rounded border border-red-200 text-red-600 text-xs font-semibold cursor-pointer"
                                  >
                                    Reverse
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 9. WALLETS */}
              {tab === 'wallets' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Member Wallets (Server-Computed)
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 pr-4">Member</th>
                            <th className="py-2 pr-4">Available</th>
                            <th className="py-2 pr-4">Pending</th>
                            <th className="py-2 pr-4">Total Earned</th>
                            <th className="py-2">Paid Out</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.members.map((m) => (
                            <tr key={m.uid} className="h-11">
                              <td className="py-2 pr-4 text-xs">
                                <span className="font-semibold text-[#0B1E36]">{m.displayName}</span>{' '}
                                <span className="text-slate-500">({m.email})</span>
                              </td>
                              <td className="py-2 pr-4 font-mono-num font-bold text-[#0D9488]">
                                ₹{m.wallet.availableBalance.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 pr-4 font-mono-num text-amber-700">
                                ₹{m.wallet.pendingCommission.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 pr-4 font-mono-num">
                                ₹{m.wallet.totalEarned.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 font-mono-num">
                                ₹{m.wallet.totalWithdrawn.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                    <h3 className="font-display text-base font-bold text-[#0B1E36]">
                      Global Wallet Ledger ({data.walletLedger.length})
                    </h3>
                    {data.walletLedger.length === 0 ? (
                      <p className="text-sm text-slate-500">No ledger movements yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Type</th>
                              <th className="py-2 pr-4">Description</th>
                              <th className="py-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.walletLedger.slice(0, 50).map((w) => (
                              <tr key={w.id} className="h-10">
                                <td className="py-2 pr-4 font-mono-num text-slate-500">
                                  {new Date(w.createdAt).toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 font-mono-num">{w.type}</td>
                                <td className="py-2 pr-4">{w.description}</td>
                                <td
                                  className={`py-2 text-right font-mono-num font-semibold ${
                                    w.amount >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                  }`}
                                >
                                  {w.amount >= 0 ? '+' : ''}₹{w.amount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 10. WITHDRAWALS */}
              {tab === 'withdrawals' && (
                <div className="space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Withdrawal Requests ({data.withdrawals.length})
                  </h2>
                  {data.withdrawals.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-500">
                      No withdrawal requests submitted yet.
                    </div>
                  ) : (
                    data.withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="font-mono-num text-base font-bold text-[#0B1E36]">
                            ₹{w.amount.toLocaleString('en-IN')} → {w.upiId}
                          </div>
                          <div className="text-slate-700">
                            {w.userName} ({w.userEmail})
                          </div>
                          <div className="text-slate-500 font-mono-num">
                            ID: {w.id} · Requested {new Date(w.createdAt).toLocaleString('en-IN')}
                          </div>
                          <div className="font-semibold capitalize pt-1">
                            Status: <span className="text-[#0D9488]">{w.status}</span>
                            {w.payoutReference ? ` · Payout Ref: ${w.payoutReference}` : ''}
                          </div>
                        </div>

                        {(w.status === 'pending' || w.status === 'approved') && (
                          <div className="flex flex-col gap-2 md:w-80 shrink-0">
                            <input
                              type="text"
                              placeholder="Payout UTR / Reference (required for Mark Paid)"
                              value={payoutRefs[w.id] || ''}
                              onChange={(e) =>
                                setPayoutRefs({ ...payoutRefs, [w.id]: e.target.value })
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono-num text-xs"
                            />
                            <div className="flex flex-wrap gap-2">
                              {w.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={busyId === w.id}
                                  onClick={() => handleWithdrawalAction(w.id, 'approve')}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={busyId === w.id}
                                onClick={() => handleWithdrawalAction(w.id, 'paid')}
                                className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-semibold cursor-pointer"
                              >
                                Mark Paid
                              </button>
                              <button
                                type="button"
                                disabled={busyId === w.id}
                                onClick={() => handleWithdrawalAction(w.id, 'reject')}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold cursor-pointer"
                              >
                                Reject & Refund
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 11. TEAM */}
              {tab === 'team' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Sponsor & Team Hierarchy
                  </h2>
                  {data.members.length === 0 ? (
                    <p className="text-sm text-slate-500">No members yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.members.map((m) => {
                        const recruits = data.members.filter((x) => x.referredByUid === m.uid);
                        return (
                          <div key={m.uid} className="py-3 flex items-center justify-between text-sm">
                            <div>
                              <div className="font-semibold text-[#0B1E36]">
                                {m.displayName}{' '}
                                <span className="font-mono-num text-xs text-slate-500">
                                  ({m.referralCode})
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                Sponsor: {m.referredByCode || 'Direct / Organic'}
                              </div>
                            </div>
                            <div className="font-mono-num text-xs font-semibold text-[#0D9488]">
                              {recruits.length} Direct Team
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 12. LEADERBOARD */}
              {tab === 'leaderboard' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Verified Partner Leaderboard
                    </h2>
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                      {(['days7', 'days30', 'allTime'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setLbRange(r)}
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                            lbRange === r ? 'bg-[#0B1E36] text-white' : 'text-slate-600'
                          }`}
                        >
                          {r === 'days7' ? '7 Days' : r === 'days30' ? '30 Days' : 'All Time'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {data.leaderboard[lbRange].length === 0 ? (
                    <p className="text-sm text-slate-500 py-6">No approved commissions yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.leaderboard[lbRange].map((e, i) => (
                        <div key={e.uid} className="py-3 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-mono-num font-bold text-slate-400 mr-3">#{i + 1}</span>
                            <span className="font-semibold text-[#0B1E36]">{e.displayName}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              ({e.verifiedSales} sales)
                            </span>
                          </div>
                          <span className="font-mono-num font-bold text-[#0D9488]">
                            ₹{e.totalCommission.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 13. REPORTS */}
              {tab === 'reports' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Financial & Operations Report
                    </h2>
                    <button
                      type="button"
                      onClick={exportReportsCsv}
                      className="px-4 py-2 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Orders CSV</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Gross Verified Sales</div>
                      <div className="font-mono-num text-xl font-bold text-[#0B1E36] mt-1">
                        ₹{data.stats.grossRevenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Approved Commissions</div>
                      <div className="font-mono-num text-xl font-bold text-[#0D9488] mt-1">
                        ₹{data.stats.approvedCommissionsAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Pending Commissions</div>
                      <div className="font-mono-num text-xl font-bold text-amber-700 mt-1">
                        ₹{data.stats.pendingCommissionsAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Paid Withdrawals</div>
                      <div className="font-mono-num text-xl font-bold text-[#6D28D9] mt-1">
                        ₹{data.stats.paidWithdrawalsAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 14-20 MODULES */}
              {tab === 'notifications' && (
                <AdminCommunicationAndSecurity data={data} onReload={loadData} mode="notifications" />
              )}
              {tab === 'offers' && (
                <AdminCommunicationAndSecurity data={data} onReload={loadData} mode="offers" />
              )}
              {tab === 'support' && (
                <AdminCommunicationAndSecurity data={data} onReload={loadData} mode="support" />
              )}
              {tab === 'website_settings' && (
                <AdminSettingsPanels data={data} onReload={loadData} mode="website" />
              )}
              {tab === 'upi_settings' && (
                <AdminSettingsPanels data={data} onReload={loadData} mode="upi" />
              )}
              {tab === 'commission_settings' && (
                <AdminSettingsPanels data={data} onReload={loadData} mode="commission" />
              )}
              {tab === 'admin_security' && (
                <AdminCommunicationAndSecurity data={data} onReload={loadData} mode="security" />
              )}

              {/* 21. AUDIT LOGS */}
              {tab === 'audit_logs' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Immutable Audit Logs ({data.auditLogs.length})
                  </h2>
                  {data.auditLogs.length === 0 ? (
                    <p className="text-sm text-slate-500">No audit logs recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 pr-4">Timestamp</th>
                            <th className="py-2 pr-4">Actor</th>
                            <th className="py-2 pr-4">Action</th>
                            <th className="py-2 pr-4">Target</th>
                            <th className="py-2">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.auditLogs.map((log) => (
                            <tr key={log.id} className="h-10">
                              <td className="py-2 pr-4 font-mono-num text-slate-500 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 pr-4">{log.actorEmail}</td>
                              <td className="py-2 pr-4 font-mono-num font-semibold text-[#0B1E36]">
                                {log.action}
                              </td>
                              <td className="py-2 pr-4 font-mono-num text-slate-500">{log.targetPath}</td>
                              <td className="py-2 text-slate-700">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* Payment Screenshot Lightbox */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div
            className="bg-white rounded-xl p-3 max-w-lg w-full space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-[#0B1E36]">Uploaded Payment Screenshot</span>
              <button
                type="button"
                onClick={() => setScreenshotModal(null)}
                className="text-xs font-semibold text-slate-500 cursor-pointer"
              >
                Close
              </button>
            </div>
            <img
              src={screenshotModal}
              alt="Payment screenshot"
              className="w-full max-h-[75vh] object-contain rounded-lg bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
