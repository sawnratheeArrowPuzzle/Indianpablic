import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { AlertCircle, X } from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import { api } from './services/api';
import type { Package, PublicCatalogResponse, UserProfile } from './types/savvvn';
import { BrandLogo } from './components/common/BrandLogo';
import { TopNav, type PublicRoute } from './components/common/TopNav';
import { Footer } from './components/common/Footer';
import { HomePage } from './components/public/HomePage';
import { PackagesPage, PackageDetailPage } from './components/public/PackagesView';
import { CheckoutView } from './components/public/CheckoutView';
import {
  AboutPage,
  ContactPage,
  FaqPage,
  PrivacyPage,
  SupportPage,
  TermsPage,
} from './components/public/StaticPages';
import { MemberPortal } from './components/dashboard/MemberPortal';
import { AdminPanel } from './components/admin/AdminPanel';

const SESSION_PKG_KEY = 'savvvn_pending_pkg';
const SESSION_REF_KEY = 'savvvn_ref_code';

export function App() {
  const [catalog, setCatalog] = useState<PublicCatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [route, setRoute] = useState<PublicRoute>('home');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_PKG_KEY) || '';
    } catch {
      return '';
    }
  });
  const [referralCode, setReferralCode] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_REF_KEY) || '';
    } catch {
      return '';
    }
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const referralCodeRef = useRef(referralCode);
  referralCodeRef.current = referralCode;

  const authPopupLockRef = useRef(false);
  const manualSignInRef = useRef(false);

  const loadCatalog = useCallback(async () => {
    setCatalogError(null);
    try {
      const data = await api.getPublicCatalog();
      setCatalog(data);
    } catch (err: any) {
      setCatalogError(err?.message || 'Unable to load SavvvnLab catalog.');
    }
  }, []);

  // Parse query params (?ref=CODE&pkg=PKG_ID&view=checkout) once on load + load catalog immediately
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref')?.trim();
      const pkgParam = params.get('pkg')?.trim();
      const viewParam = params.get('view')?.trim() as PublicRoute | null;

      if (refParam) {
        const cleanRef = refParam.toUpperCase();
        sessionStorage.setItem(SESSION_REF_KEY, cleanRef);
        setReferralCode(cleanRef);
        referralCodeRef.current = cleanRef;
      }
      if (pkgParam) {
        sessionStorage.setItem(SESSION_PKG_KEY, pkgParam);
        setSelectedPackageId(pkgParam);
        setRoute(viewParam === 'checkout' ? 'checkout' : 'package-detail');
      } else if (
        viewParam &&
        ['home', 'packages', 'about', 'contact', 'support', 'faq', 'terms', 'privacy'].includes(
          viewParam
        )
      ) {
        setRoute(viewParam);
      }
    } catch {
      // Ignore storage/URL parsing errors
    }
    loadCatalog();
  }, [loadCatalog]);

  // Register Firebase Auth observer once (uses refs + single-flight deduplication so no duplicate session requests run)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (!fbUser) {
          setUser(null);
          return;
        }

        // If an explicit sign-in click is running, it coordinates session creation + immediate redirect directly
        if (manualSignInRef.current) {
          return;
        }

        try {
          let savedRef = '';
          try {
            savedRef = sessionStorage.getItem(SESSION_REF_KEY) || '';
          } catch {
            savedRef = '';
          }
          const { user: profile } = await api.establishSession(
            savedRef || referralCodeRef.current,
            fbUser
          );
          setUser(profile);
        } catch (err: any) {
          console.error('Session sync failed:', err);
          setAuthNotice(err?.message || 'Could not verify your account session.');
        }
      },
      (authErr) => {
        console.error('Firebase Auth state error:', authErr);
        setAuthNotice(authErr?.message || 'Authentication session error. Please sign in again.');
      }
    );

    return () => unsubscribe();
  }, []);

  const navigate = useCallback((nextRoute: PublicRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedPackage = useMemo<Package | null>(() => {
    if (!catalog?.packages?.length) return null;
    if (selectedPackageId) {
      const match = catalog.packages.find((p) => p.id === selectedPackageId);
      if (match) return match;
    }
    return catalog.packages[0] || null;
  }, [catalog, selectedPackageId]);

  const handleGoogleSignIn = useCallback(
    async (destinationOnSuccess?: PublicRoute) => {
      if (authPopupLockRef.current) return;
      authPopupLockRef.current = true;
      manualSignInRef.current = true;
      setAuthBusy(true);
      setAuthNotice(null);

      try {
        const credential = await signInWithPopup(auth, googleProvider);
        let savedRef = '';
        let pendingPkg = '';
        try {
          savedRef = sessionStorage.getItem(SESSION_REF_KEY) || '';
          pendingPkg = sessionStorage.getItem(SESSION_PKG_KEY) || '';
        } catch {
          savedRef = '';
          pendingPkg = '';
        }

        const { user: profile } = await api.establishSession(
          savedRef || referralCodeRef.current,
          credential.user
        );
        setUser(profile);

        if (destinationOnSuccess === 'checkout' || pendingPkg) {
          if (pendingPkg) {
            setSelectedPackageId(pendingPkg);
          }
          navigate('checkout');
        } else if (destinationOnSuccess) {
          if (destinationOnSuccess === 'admin' && profile.role !== 'admin') {
            navigate('dashboard');
          } else {
            navigate(destinationOnSuccess);
          }
        } else {
          navigate(profile.role === 'admin' ? 'admin' : 'dashboard');
        }
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          setAuthNotice('Google login was cancelled before finishing.');
        } else if (code === 'auth/popup-blocked') {
          setAuthNotice(
            'Sign-in popup was blocked by your browser. Please allow popups for this site and tap again.'
          );
        } else if (code === 'auth/network-request-failed') {
          setAuthNotice('Network error during Google Sign-In. Please check your connection and try again.');
        } else if (code === 'auth/unauthorized-domain') {
          setAuthNotice('This domain is not authorized for Google Sign-In in Firebase Auth.');
        } else {
          setAuthNotice(err?.message || 'Google sign-in could not be completed. Please try again.');
        }
      } finally {
        manualSignInRef.current = false;
        authPopupLockRef.current = false;
        setAuthBusy(false);
      }
    },
    [navigate]
  );

  const handleSelectPackage = useCallback(
    (pkg: Package) => {
      setSelectedPackageId(pkg.id);
      try {
        sessionStorage.setItem(SESSION_PKG_KEY, pkg.id);
      } catch {
        // Ignore storage error
      }
      navigate('package-detail');
    },
    [navigate]
  );

  const handleBuyPackage = useCallback(
    async (pkg: Package) => {
      setSelectedPackageId(pkg.id);
      try {
        sessionStorage.setItem(SESSION_PKG_KEY, pkg.id);
      } catch {
        // Ignore storage error
      }

      if (auth.currentUser && user) {
        navigate('checkout');
      } else {
        await handleGoogleSignIn('checkout');
      }
    },
    [handleGoogleSignIn, navigate, user]
  );

  const handleTopNavAuthAction = useCallback(() => {
    if (user) {
      navigate(user.role === 'admin' ? 'admin' : 'dashboard');
    } else {
      handleGoogleSignIn('dashboard');
    }
  }, [handleGoogleSignIn, navigate, user]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_PKG_KEY);
    } catch {
      // Ignore storage error
    }
    navigate('home');
  }, [navigate]);

  if (!catalog && !catalogError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <BrandLogo variant="full" className="mx-auto" />
          <div className="w-7 h-7 rounded-full border-2 border-[#4F1CEB] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Loading SavvvnLab...</p>
        </div>
      </div>
    );
  }

  // Full-screen Admin Console (strictly gated by server-verified role)
  if (route === 'admin' && user?.role === 'admin') {
    return (
      <AdminPanel
        user={user}
        onOpenMemberDashboard={() => navigate('dashboard')}
        onGoPublicHome={() => {
          loadCatalog();
          navigate('home');
        }}
        onLogout={handleLogout}
      />
    );
  }

  // Full-screen Member Workspace
  if (route === 'dashboard' && user && catalog) {
    return (
      <MemberPortal
        user={user}
        catalog={catalog}
        onRefreshUser={(updated) => setUser(updated)}
        onBuyPackage={handleBuyPackage}
        onOpenAdmin={() => {
          if (user.role === 'admin') navigate('admin');
        }}
        onGoPublicHome={() => navigate('home')}
        onLogout={handleLogout}
      />
    );
  }

  const fallbackSettings = {
    siteName: 'SavvvnLab',
    tagline: 'Learn · Create · Grow',
    heroTitle: 'Learn Today, Grow Tomorrow',
    heroSubtitle: 'Upgrade Your Skills with SavvvnLab',
    aboutSummary:
      'SavvvnLab is a creator-focused digital learning platform built around structured skill packages.',
    supportEmail: 'support@savvvnlab.in',
    supportPhone: '+91 98765 00000',
    instagramUrl: '',
    youtubeUrl: '',
    telegramUrl: '',
    whatsappUrl: '',
    upiId: '',
    upiPayeeName: 'SavvvnLab Official',
    upiInstructions: '',
    customUpiQrUrl: '',
    minWithdrawal: 500,
    defaultCommissionPercent: 25,
  };

  const catalogUnavailableCard = (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 text-center shadow-xs">
        <BrandLogo variant="full" className="mx-auto" />
        <h1 className="font-display text-xl font-bold text-[#0B1E36]">
          Catalog Unavailable
        </h1>
        <p className="text-sm text-slate-600">{catalogError}</p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={loadCatalog}
            className="px-5 py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold cursor-pointer"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => navigate('support')}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-[#0B1E36] hover:bg-slate-50 cursor-pointer"
          >
            Support
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopNav
        currentRoute={route}
        onNavigate={navigate}
        user={user}
        authBusy={authBusy}
        onAuthAction={handleTopNavAuthAction}
      />

      {authBusy && (
        <div className="bg-[#EEF2FF] border-b border-indigo-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm text-[#3730A3] font-medium">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#4F1CEB] border-t-transparent animate-spin" />
            <span>Signing in with Google and preparing your SavvvnLab account...</span>
          </div>
        </div>
      )}

      {authNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>{authNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthNotice(null)}
              aria-label="Dismiss notice"
              className="p-1 rounded hover:bg-amber-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {route === 'home' &&
          (catalog ? (
            <HomePage
              catalog={catalog}
              onSelectPackage={handleSelectPackage}
              onBuyPackage={handleBuyPackage}
              onNavigate={navigate}
            />
          ) : (
            catalogUnavailableCard
          ))}

        {route === 'packages' &&
          (catalog ? (
            <PackagesPage
              catalog={catalog}
              onSelectPackage={handleSelectPackage}
              onBuyPackage={handleBuyPackage}
            />
          ) : (
            catalogUnavailableCard
          ))}

        {route === 'package-detail' &&
          (catalog && selectedPackage ? (
            <PackageDetailPage
              pkg={selectedPackage}
              catalog={catalog}
              onBack={() => navigate('packages')}
              onBuyPackage={handleBuyPackage}
            />
          ) : (
            catalogUnavailableCard
          ))}

        {route === 'checkout' &&
          (catalog && selectedPackage ? (
            <CheckoutView
              pkg={selectedPackage}
              catalog={catalog}
              user={user}
              referralCode={referralCode}
              onGoogleSignIn={() => handleGoogleSignIn('checkout')}
              onBack={() => navigate('package-detail')}
              onGoToDashboard={() => navigate('dashboard')}
            />
          ) : (
            catalogUnavailableCard
          ))}

        {route === 'about' && (
          <AboutPage
            catalog={
              catalog || {
                packages: [],
                courses: [],
                packageCourses: [],
                offers: [],
                settings: fallbackSettings,
              }
            }
            onNavigate={navigate}
          />
        )}
        {route === 'contact' && (
          <ContactPage
            catalog={
              catalog || {
                packages: [],
                courses: [],
                packageCourses: [],
                offers: [],
                settings: fallbackSettings,
              }
            }
          />
        )}
        {route === 'support' && (
          <SupportPage
            user={user}
            onGoogleSignIn={() => handleGoogleSignIn('support')}
            onNavigate={navigate}
          />
        )}
        {route === 'faq' && <FaqPage />}
        {route === 'terms' && <TermsPage />}
        {route === 'privacy' && <PrivacyPage />}

        {/* If user navigated to dashboard/admin while signed out, show prompt cleanly */}
        {route === 'dashboard' && user && !catalog && catalogUnavailableCard}
        {(route === 'dashboard' || route === 'admin') && !user && (
          <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
            <BrandLogo variant="full" className="mx-auto" />
            <h1 className="font-display text-2xl font-bold text-[#0B1E36]">
              Sign in to access your SavvvnLab account
            </h1>
            <p className="text-sm text-slate-600">
              Use Google Sign-In to open your courses, referral links, wallet ledger, or administration console.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={authBusy}
                onClick={() => handleGoogleSignIn(route)}
                className="px-6 py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {authBusy && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                <span>{authBusy ? 'Signing in...' : 'Continue with Google'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('home')}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-[#0B1E36] cursor-pointer"
              >
                Back Home
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer
        onNavigate={navigate}
        onSelectPackage={handleSelectPackage}
        packages={catalog?.packages || []}
        settings={catalog?.settings || fallbackSettings}
      />
    </div>
  );
}

export default App;
