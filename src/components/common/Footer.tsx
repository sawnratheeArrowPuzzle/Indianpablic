import React from 'react';
import { Mail, Phone, Youtube, Send, Instagram, Globe } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { PublicRoute } from './TopNav';
import type { Package, PublicCatalogResponse } from '../../types/savvvn';

interface FooterProps {
  onNavigate: (route: PublicRoute) => void;
  onSelectPackage?: (pkg: Package) => void;
  packages?: Package[];
  settings?: PublicCatalogResponse['settings'] | null;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onSelectPackage,
  packages = [],
  settings,
}) => {
  return (
    <footer className="bg-[#0B1530] text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Column 1: Brand */}
        <div className="space-y-2.5">
          <div>
            <BrandLogo variant="footer" surface="dark" />
          </div>
          <p className="text-xs text-slate-300/90 tracking-wide">
            {settings?.tagline || 'Learn · Create · Grow'}
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Home
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                About
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('faq')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                FAQ
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Dynamic Packages from Admin/Firestore */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Packages</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {packages.length > 0 ? (
              packages.slice(0, 5).map((pkg) => (
                <li key={pkg.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPackage ? onSelectPackage(pkg) : onNavigate('packages')
                    }
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    {pkg.name}
                  </button>
                </li>
              ))
            ) : (
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('packages')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  View Packages
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Contact Us</h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="break-all">
                {settings?.supportEmail || 'support@savvvnlab.com'}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono-num">
                {settings?.supportPhone || '+91 98765 00000'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright + Social Row */}
      <div className="border-t border-white/10 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} SavvvnLab. All rights reserved.</span>

          <div className="flex items-center gap-4 text-slate-300">
            {settings?.youtubeUrl && (
              <a
                href={settings.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="hover:text-white transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {settings?.telegramUrl && (
              <a
                href={settings.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="hover:text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
            {settings?.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              aria-label="Support Desk"
              onClick={() => onNavigate('support')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
