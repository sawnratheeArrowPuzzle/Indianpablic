import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { PublicCatalogResponse, UserProfile } from '../../types/savvvn';
import type { PublicRoute } from '../common/TopNav';

export const AboutPage: React.FC<{
  catalog: PublicCatalogResponse;
  onNavigate: (r: PublicRoute) => void;
}> = ({ catalog, onNavigate }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
    <div className="space-y-3">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B1E36] tracking-tight">
        About {catalog.settings.siteName}
      </h1>
      <p className="text-base text-slate-600 leading-relaxed">
        {catalog.settings.aboutSummary}
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <h2 className="font-display text-lg font-bold text-[#0B1E36]">Structured Skill Packages</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Instead of scattered single videos, SavvvnLab bundles complementary digital skills—editing, visual design, and creator growth—into unified tiers.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <h2 className="font-display text-lg font-bold text-[#0B1E36]">Transparent Accounting</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          All package enrollments, referral commissions, and UPI withdrawals are logged in immutable server ledgers verified by administrators.
        </p>
      </div>
    </div>

    <div>
      <button
        type="button"
        onClick={() => onNavigate('packages')}
        className="px-5 py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold cursor-pointer"
      >
        Explore Learning Packages
      </button>
    </div>
  </div>
);

export const ContactPage: React.FC<{ catalog: PublicCatalogResponse }> = ({ catalog }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.submitPublicContact({ name, email, subject, message });
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-5 space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#0B1E36] tracking-tight">Contact Us</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Questions about package enrollment, UPI payment verification, or partner commissions? Reach out directly to our team.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Support Email</span>
            <span className="font-medium text-[#0B1E36]">{catalog.settings.supportEmail}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Phone / WhatsApp</span>
            <span className="font-mono-num font-medium text-[#0B1E36]">{catalog.settings.supportPhone}</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
            <h2 className="font-display text-lg font-bold text-[#0B1E36]">Inquiry Received</h2>
            <p className="text-sm text-slate-600">
              Your message has been logged in our support queue. Our team will respond shortly.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1E36] cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const SupportPage: React.FC<{
  user: UserProfile | null;
  onGoogleSignIn: () => Promise<void>;
  onNavigate: (r: PublicRoute) => void;
}> = ({ user, onGoogleSignIn, onNavigate }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createSupportTicket({ subject, message });
      setDone(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'Could not submit ticket');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#0B1E36] tracking-tight">
        Support Desk
      </h1>
      <p className="text-sm text-slate-600">
        Need assistance with a pending UPI payment, course unlock, or withdrawal? Submit a support ticket linked directly to your account.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Sign in with Google to raise a tracked member support ticket, or use the public contact form.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onGoogleSignIn()}
                className="px-5 py-2.5 rounded-lg bg-[#0B1E36] text-white text-sm font-semibold cursor-pointer"
              >
                Sign In with Google
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-[#0B1E36] cursor-pointer"
              >
                Open Public Contact Form
              </button>
            </div>
          </div>
        ) : done ? (
          <div className="py-6 space-y-3">
            <div className="text-base font-semibold text-[#16A34A]">Support Ticket Created</div>
            <p className="text-sm text-slate-600">
              You can track replies directly inside your Member Dashboard → Support section.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-semibold cursor-pointer"
            >
              Open Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-slate-500">Signed in as {user.email}</div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ticket Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Payment verification check for Order ORD-..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Details</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
              />
            </div>
            {error && <div className="text-xs text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-lg bg-[#0B1E36] text-white text-sm font-semibold cursor-pointer"
            >
              {busy ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const FAQ_ITEMS = [
  {
    q: 'How are courses unlocked after payment?',
    a: 'After paying via UPI and submitting your UTR reference plus screenshot, an administrator verifies the transaction. Once approved, the package and all mapped courses unlock immediately.',
  },
  {
    q: 'Can I buy a single course without a package?',
    a: 'No. SavvvnLab offers structured multi-course packages so every learner gets complete, cohesive skill tracks rather than isolated fragments.',
  },
  {
    q: 'How do referral commissions and wallet payouts work?',
    a: 'When someone enrolls through your referral link and their UPI payment is verified, a commission entry is recorded under your account. Once approved, it credits to your available wallet balance for UPI withdrawal.',
  },
  {
    q: 'What happens if a payment UTR is invalid or duplicate?',
    a: 'Duplicate UTR submissions are automatically blocked. If a transaction cannot be matched, an administrator rejects the submission with a reason and no package or commission is credited.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#0B1E36] tracking-tight">
        Frequently Asked Questions
      </h1>
      <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx} className="p-5">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between gap-4 text-left font-display font-semibold text-[#0B1E36] cursor-pointer"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                  openIndex === idx ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
    <h1 className="font-display text-3xl font-bold text-[#0B1E36] tracking-tight">
      Terms & Conditions
    </h1>
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 text-sm text-slate-600 leading-relaxed">
      <p>
        1. Enrollment & Access: SavvvnLab learning packages grant personal, non-transferable digital access to the courses mapped to your purchased tier once UPI payment is verified by an administrator.
      </p>
      <p>
        2. Payment Verification: Uploading a payment screenshot or UTR does not grant automatic access. Access is provisioned strictly after manual verification of the settled UPI transaction.
      </p>
      <p>
        3. Partner Commissions & Reversals: Referral commissions apply only to verified, non-refunded sales attributed to active sponsors. Self-referrals are prohibited. Refunded or cancelled orders result in automatic commission reversal.
      </p>
      <p>
        4. Withdrawals: Withdrawal requests are subject to available verified wallet balance and minimum/maximum thresholds configured by SavvvnLab administration.
      </p>
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
    <h1 className="font-display text-3xl font-bold text-[#0B1E36] tracking-tight">
      Privacy Policy
    </h1>
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 text-sm text-slate-600 leading-relaxed">
      <p>
        1. Account Information: SavvvnLab uses Google Sign-In via Firebase Authentication to verify identity and secure member accounts. We store your name, verified email address, optional phone number, and payout UPI handle strictly for platform delivery and payouts.
      </p>
      <p>
        2. Financial & Transaction Records: Order history, UPI reference numbers, and wallet ledger entries are retained for transaction verification, fraud prevention, and audit transparency.
      </p>
      <p>
        3. Data Isolation: Personal wallet balances, withdrawal history, and support tickets are accessible only to the account owner and authorized SavvvnLab administrators.
      </p>
    </div>
  </div>
);
