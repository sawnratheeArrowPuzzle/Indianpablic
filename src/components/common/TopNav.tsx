import React, { useState } from 'react';
import { Menu, User, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { UserAvatar } from './UserAvatar';
import { AUTHORIZED_ADMIN_EMAIL } from '../../lib/firebase';
import type { UserProfile } from '../../types/savvvn';

export type PublicRoute =
  | 'home'
  | 'packages'
  | 'package-detail'
  | 'about'
  | 'contact'
  | 'support'
  | 'faq'
  | 'terms'
  | 'privacy'
  | 'checkout'
  | 'dashboard'
  | 'admin';

interface TopNavProps {
  currentRoute: PublicRoute;
  onNavigate: (route: PublicRoute) => void;
  user: UserProfile | null;
  authBusy?: boolean;
  onAuthAction: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentRoute,
  onNavigate,
  user,
  authBusy = false,
  onAuthAction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ label: string; route: PublicRoute }> = [
    { label: 'Home', route: 'home' },
    { label: 'Packages', route: 'packages' },
    { label: 'About', route: 'about' },
    { label: 'Support', route: 'support' },
    { label: 'Contact', route: 'contact' },
  ];

  const handleLinkClick = (route: PublicRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  const isAdmin = Boolean(
    user &&
      user.role === 'admin' &&
      user.email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL
  );

  const primaryCtaLabel = user
    ? isAdmin
      ? 'Admin Console'
      : 'My Dashboard'
    : authBusy
    ? 'Signing in...'
    : 'Login';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Official SavvvnLab Logo */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F1CEB]"
        >
          <BrandLogo variant="header" />
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const active =
              currentRoute === item.route ||
              (item.route === 'packages' && currentRoute === 'package-detail');
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleLinkClick(item.route)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#4F1CEB] font-semibold border-[#4F1CEB]'
                    : 'border-transparent hover:text-[#0B1530] hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Orange Login / Account CTA + Mobile Drawer Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={!user && authBusy}
            onClick={onAuthAction}
            className="px-4 py-2 rounded-lg bg-[#FF6B00] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B00]"
          >
            {!user && authBusy ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
            ) : user?.photoURL ? (
              <UserAvatar
                src={user.photoURL}
                name={user.displayName}
                className="w-5 h-5 rounded-full object-cover border border-white/40 shrink-0"
                fallbackClassName="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0"
              />
            ) : (
              <User className="w-4 h-4 shrink-0" />
            )}
            <span>{primaryCtaLabel}</span>
          </button>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-[#0B1530] hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleLinkClick(item.route)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === item.route
                  ? 'bg-[#4F1CEB] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
