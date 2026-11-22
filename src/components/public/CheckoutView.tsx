import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  AlertCircle,
  Upload,
  Clock,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { api } from '../../services/api';
import type { Order, Package, Payment, PublicCatalogResponse, UserProfile } from '../../types/savvvn';

interface CheckoutViewProps {
  pkg: Package;
  catalog: PublicCatalogResponse;
  user: UserProfile | null;
  referralCode: string;
  onGoogleSignIn: () => Promise<void>;
  onBack: () => void;
  onGoToDashboard: () => void;
}

function readImageAsCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const maxWidth = 1080;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  pkg,
  catalog,
  user,
  referralCode,
  onGoogleSignIn,
  onBack,
  onGoToDashboard,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [submittedPayment, setSubmittedPayment] = useState<Payment | null>(null);
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const alreadyOwned = Boolean(user?.unlockedPackageIds.includes(pkg.id));
  const upiId = catalog.settings.upiId?.trim() || '';
  const payeeName = catalog.settings.upiPayeeName?.trim() || 'SavvvnLab';

  useEffect(() => {
    let cancelled = false;
    if (!user || alreadyOwned) return;

    setLoadingOrder(true);
    setError(null);
    api
      .createOrder(pkg.id, referralCode)
      .then((res) => {
        if (!cancelled) setOrder(res.order);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Unable to prepare order');
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, pkg.id, referralCode, alreadyOwned]);

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select a PNG or JPG screenshot image.');
      return;
    }
    try {
      const compressed = await readImageAsCompressedDataUrl(file);
      setScreenshotUrl(compressed);
      setScreenshotName(file.name);
    } catch (err: any) {
      setError(err?.message || 'Could not process screenshot');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitUpiPayment({
        orderId: order.id,
        utr: utr.trim(),
        screenshotUrl,
      });
      setSubmittedPayment(res.payment);
      setOrder(res.order);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit payment details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignInClick = async () => {
    setAuthBusy(true);
    setError(null);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setAuthBusy(false);
    }
  };

  const upiUri = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${pkg.price}&tn=${encodeURIComponent(order ? `SavvvnLab-${order.id}` : pkg.name)}&cu=INR`
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0B1E36] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to packages</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs font-medium text-[#0D9488]">
              UPI Checkout {referralCode ? `· Sponsor ${referralCode}` : ''}
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0B1E36] mt-1">
              {pkg.name}
            </h1>
            <p className="text-sm text-slate-500">{pkg.subtitle}</p>
          </div>
          <div className="sm:text-right">
            <div className="text-xs text-slate-500">Exact Payable Amount</div>
            <div className="font-mono-num text-3xl font-bold text-[#0B1E36]">
              ₹{pkg.price.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Step 1: Google Sign-In Gate */}
        {!user && (
          <div className="py-8 max-w-md mx-auto text-center space-y-4">
            <BrandLogo variant="full" className="mx-auto" />
            <h2 className="font-display text-xl font-bold text-[#0B1E36]">
              Sign in with Google to continue
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your selected package ({pkg.name} — ₹{pkg.price.toLocaleString('en-IN')}) is saved. Sign in with Google so your order and unlocked courses are securely tied to your account.
            </p>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-left">
                {error}
              </div>
            )}
            <button
              type="button"
              disabled={authBusy}
              onClick={handleSignInClick}
              className="w-full py-3 px-5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold inline-flex items-center justify-center gap-3 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>{authBusy ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}

        {/* Already Owned */}
        {user && alreadyOwned && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
            <h2 className="font-display text-xl font-bold text-[#0B1E36]">
              You already own {pkg.name}
            </h2>
            <p className="text-sm text-slate-600">
              All courses included in this package are already unlocked in your member dashboard.
            </p>
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-6 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-semibold cursor-pointer"
            >
              Open My Courses
            </button>
          </div>
        )}

        {/* Payment Submitted Receipt (Pending Verification) */}
        {user && !alreadyOwned && submittedPayment && (
          <div className="py-6 space-y-5">
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                  Payment Submitted — Pending Admin Verification
                </h2>
                <p className="text-sm text-slate-700">
                  Your UTR reference (<span className="font-mono-num font-semibold">{submittedPayment.utr}</span>) and screenshot have been recorded. Courses unlock only after an administrator verifies the transaction.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <span className="text-xs text-slate-500 block">Order ID</span>
                <span className="font-mono-num font-semibold text-[#0B1E36]">{submittedPayment.orderId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Amount Submitted</span>
                <span className="font-mono-num font-semibold text-[#0B1E36]">
                  ₹{submittedPayment.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Status</span>
                <span className="font-semibold text-amber-700">Pending Verification</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onGoToDashboard}
                className="px-6 py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold cursor-pointer"
              >
                Track Status in Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Active UPI Checkout Form */}
        {user && !alreadyOwned && !submittedPayment && (
          <>
            {loadingOrder ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Creating secure order record...
              </div>
            ) : !upiId ? (
              <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 space-y-2">
                <div className="font-semibold">UPI Payment Handle Not Configured Yet</div>
                <p className="text-xs text-amber-800">
                  An administrator needs to configure the official SavvvnLab UPI ID under Admin Panel → UPI Settings before payments can be accepted.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: UPI QR & ID */}
                <div className="md:col-span-5 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center space-y-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Scan & Pay Exact Amount
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    {catalog.settings.customUpiQrUrl ? (
                      <img
                        src={catalog.settings.customUpiQrUrl}
                        alt="SavvvnLab UPI QR Code"
                        referrerPolicy="no-referrer"
                        className="w-44 h-44 object-contain"
                      />
                    ) : (
                      <QRCodeSVG value={upiUri} size={176} level="M" includeMargin={false} />
                    )}
                  </div>

                  <div className="w-full space-y-1.5">
                    <div className="text-xs text-slate-500">Payee: {payeeName}</div>
                    <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <span className="font-mono-num text-xs font-semibold text-[#0B1E36] truncate">
                        {upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-xs font-semibold text-[#0D9488] hover:text-[#0f766e] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {catalog.settings.upiInstructions}
                  </p>
                </div>

                {/* Right: UTR & Screenshot Submission */}
                <form onSubmit={handleSubmitPayment} className="md:col-span-7 space-y-4">
                  {order && (
                    <div className="text-xs text-slate-500 font-mono-num">
                      Order Reference: <strong className="text-[#0B1E36]">{order.id}</strong> · Account: {user.email}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#0B1E36] mb-1.5">
                      UTR / UPI Reference Number
                    </label>
                    <input
                      type="text"
                      required
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="e.g. 432198765432"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-num text-[#0B1E36] focus:outline-none focus:border-[#0D9488]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter the 12-digit UTR or transaction reference shown in your UPI app.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B1E36] mb-1.5">
                      Payment Screenshot
                    </label>
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-[#0D9488] rounded-xl p-5 bg-slate-50 hover:bg-teal-50/30 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 text-slate-500 mb-1.5" />
                      <span className="text-xs font-medium text-[#0B1E36]">
                        {screenshotName || 'Click to upload UPI payment screenshot'}
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5">PNG or JPG image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>

                    {screenshotUrl && (
                      <div className="mt-3 flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <img
                          src={screenshotUrl}
                          alt="Uploaded payment proof"
                          className="w-14 h-14 object-cover rounded border border-slate-200"
                        />
                        <div className="text-xs text-slate-600">
                          Screenshot attached and ready for verification.
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !order}
                    className="w-full py-3 px-5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Submitting Proof...' : `Submit ₹${pkg.price.toLocaleString('en-IN')} Payment for Verification`}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
