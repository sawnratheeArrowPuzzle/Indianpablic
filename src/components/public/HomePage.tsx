import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Code2,
  GraduationCap,
  Home,
  Minus,
  Monitor,
  Palette,
  Play,
  Plus,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import type { Course, Package, PublicCatalogResponse } from '../../types/savvvn';
import type { PublicRoute } from '../common/TopNav';
import { PackageCoverImage } from '../common/PackageCoverImage';

interface HomePageProps {
  catalog: PublicCatalogResponse;
  onSelectPackage: (pkg: Package) => void;
  onBuyPackage: (pkg: Package) => void;
  onNavigate: (route: PublicRoute) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Home, bg: 'from-[#6366F1] to-[#4F1CEB]' },
  { id: 'technology', label: 'Technology', icon: Monitor, bg: 'from-[#38BDF8] to-[#0284C7]' },
  { id: 'business', label: 'Business', icon: GraduationCap, bg: 'from-[#4ADE80] to-[#16A34A]' },
  { id: 'marketing', label: 'Marketing', icon: BarChart3, bg: 'from-[#FB923C] to-[#EA580C]' },
  { id: 'design', label: 'Design', icon: Palette, bg: 'from-[#A78BFA] to-[#7C3AED]' },
  { id: 'development', label: 'Development', icon: Code2, bg: 'from-[#2DD4BF] to-[#0D9488]' },
] as const;

const FAQ_ITEMS = [
  {
    q: 'How to get started?',
    a: 'Choose a package above, click Enroll Now, sign in with your Google account, and complete the UPI checkout to unlock your learning dashboard.',
  },
  {
    q: 'Is this platform free?',
    a: 'SavvvnLab offers structured paid learning packages. Once your UPI payment is verified by an administrator, your package unlocks immediately.',
  },
  {
    q: 'Can I access on mobile?',
    a: 'Yes. SavvvnLab works smoothly across mobile phones, tablets, and desktop browsers so you can learn and manage your account anywhere.',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  catalog,
  onSelectPackage,
  onBuyPackage,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const categoryStripRef = useRef<HTMLDivElement | null>(null);

  const scrollToPackages = () => {
    const el = document.getElementById('our-packages');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onNavigate('packages');
    }
  };

  const handleCategoryCycle = () => {
    if (categoryStripRef.current) {
      categoryStripRef.current.scrollBy({ left: 180, behavior: 'smooth' });
    }
    const currentIdx = CATEGORIES.findIndex((c) => c.id === selectedCategory);
    const next = CATEGORIES[(currentIdx + 1) % CATEGORIES.length];
    setSelectedCategory(next.id);
  };

  // Match category filter against mapped course categories & package copy cleanly
  const displayedPackages = useMemo(() => {
    if (selectedCategory === 'all') return catalog.packages;

    const filtered = catalog.packages.filter((pkg) => {
      const mappedCourseIds = catalog.packageCourses
        .filter((pc) => pc.packageId === pkg.id)
        .map((pc) => pc.courseId);
      const mappedCourses = mappedCourseIds
        .map((cid) => catalog.courses.find((c) => c.id === cid))
        .filter((c): c is Course => Boolean(c));

      const haystack = [
        pkg.name,
        pkg.subtitle,
        pkg.description,
        ...mappedCourses.map((c) => `${c.title} ${c.category}`),
      ]
        .join(' ')
        .toLowerCase();

      if (selectedCategory === 'marketing') {
        return haystack.includes('marketing') || haystack.includes('growth') || haystack.includes('social') || haystack.includes('youtube');
      }
      if (selectedCategory === 'design') {
        return haystack.includes('design') || haystack.includes('canva') || haystack.includes('video') || haystack.includes('editing');
      }
      if (selectedCategory === 'technology') {
        return haystack.includes('tech') || haystack.includes('video') || haystack.includes('digital');
      }
      if (selectedCategory === 'business') {
        return haystack.includes('business') || haystack.includes('creator') || haystack.includes('freelance') || haystack.includes('pro');
      }
      if (selectedCategory === 'development') {
        return haystack.includes('dev') || haystack.includes('build') || haystack.includes('workflow');
      }
      return haystack.includes(selectedCategory);
    });

    return filtered;
  }, [catalog.courses, catalog.packageCourses, catalog.packages, selectedCategory]);

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A]">
      {/* 1. Hero Banner: Learn Today, Grow Tomorrow */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F4F1FF] via-[#EAE4FF] to-[#DFD5FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-6 py-10 sm:py-14 lg:py-16 space-y-4">
            <h1
              className="font-display font-extrabold tracking-tight leading-[1.08]"
              style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.6rem)' }}
            >
              <span className="block text-[#0F172A]">Learn Today,</span>
              <span className="block text-[#4F1CEB]">Grow Tomorrow</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 font-medium">
              Upgrade Your Skills with SavvvnLab
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToPackages}
                className="px-6 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#ea580c] text-white text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center lg:justify-end self-end">
            <img
              src="/assets/savvvn-ui/hero-graduate.jpg"
              alt="SavvvnLab graduate student"
              referrerPolicy="no-referrer"
              className="w-full max-w-xl h-auto object-cover rounded-t-xl lg:rounded-none block"
            />
          </div>
        </div>
      </section>

      {/* 2. Never Stop Learning Banner */}
      <section className="bg-gradient-to-r from-white via-[#F6FBFF] to-[#E3F3FF] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-5 py-10 sm:py-12 space-y-4">
            <h2
              className="font-display font-extrabold tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.75rem)' }}
            >
              <span className="block text-[#0F172A]">Never Stop</span>
              <span className="block text-[#4F1CEB]">Learning</span>
            </h2>

            <p className="text-base text-slate-700">
              Build a better future with SavvvnLab
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={scrollToPackages}
                className="px-6 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#ea580c] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center lg:justify-end self-end">
            <img
              src="/assets/savvvn-ui/never-stop-learning.jpg"
              alt="Learner studying with laptop on SavvvnLab"
              referrerPolicy="no-referrer"
              className="w-full max-w-xl h-auto object-cover block"
            />
          </div>
        </div>
      </section>

      {/* 3. Category Strip + 4. Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Category Strip */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div
            ref={categoryStripRef}
            className="flex items-center justify-between gap-5 sm:gap-8 overflow-x-auto no-scrollbar flex-1 py-1"
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    scrollToPackages();
                  }}
                  className={`flex flex-col items-center gap-2 shrink-0 min-w-[72px] group cursor-pointer transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <span
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${cat.bg} text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                      isSelected ? 'ring-2 ring-offset-2 ring-[#4F1CEB]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isSelected ? 'text-[#4F1CEB]' : 'text-[#0F172A]'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCategoryCycle}
            aria-label="Next category"
            className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Feature Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#4F1CEB] text-white flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A]">Expert Guidance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Learn from the best</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#10B981] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A]">Trusted Platform</h3>
              <p className="text-xs text-slate-500 mt-0.5">Safe &amp; Secure</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FB923C] to-[#F97316] text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A]">Flexible Learning</h3>
              <p className="text-xs text-slate-500 mt-0.5">Anytime, Anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Our Packages Section (Connected Dynamically to Admin/Firestore Packages) */}
      <section id="our-packages" className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-12 space-y-7">
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#4F1CEB]/40" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] text-center whitespace-nowrap">
            Our Packages
          </h2>
          <span className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#4F1CEB]/40" />
        </div>

        {displayedPackages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              {selectedCategory === 'all'
                ? 'No packages are currently published.'
                : 'No packages match this category yet.'}
            </p>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 rounded-lg bg-[#4F1CEB] text-white text-xs font-semibold cursor-pointer"
              >
                Show All Packages
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedPackages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => onSelectPackage(pkg)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPackage(pkg);
                  }
                }}
                className={`bg-white rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  pkg.featured ? 'border-2 border-[#4F1CEB]' : 'border border-slate-100'
                }`}
              >
                {/* Admin-Uploaded Cover Image */}
                <div className="sm:col-span-5 aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100">
                  <PackageCoverImage src={pkg.coverImageUrl} alt={pkg.name} />
                </div>

                {/* Package Name + Price + Enroll Now */}
                <div className="sm:col-span-7 flex flex-col justify-center space-y-2.5">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F172A]">
                    {pkg.name}
                  </h3>

                  <div className="font-mono-num text-3xl font-extrabold text-[#0F172A]">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuyPackage(pkg);
                    }}
                    className="w-full py-2.5 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#ea580c] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Your Learning Our Priority Banner */}
      <section className="bg-gradient-to-r from-[#EEF2FF] via-[#F4F0FF] to-[#DFD5FF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-7 flex justify-center lg:justify-start self-end">
            <img
              src="/assets/savvvn-ui/students-priority.jpg"
              alt="Happy SavvvnLab learners"
              referrerPolicy="no-referrer"
              className="w-full max-w-2xl h-auto object-cover block"
            />
          </div>

          <div className="lg:col-span-5 py-8 sm:py-10 lg:py-12 space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F172A] leading-tight">
              <span className="block">Your Learning</span>
              <span className="block">Our Priority</span>
            </h2>
            <div>
              <button
                type="button"
                onClick={scrollToPackages}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#ea580c] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why Choose Us ? + Books Visual + 4 Icon Tiles */}
      <section className="bg-white border-b border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              Why Choose Us ?
            </h2>
            <p className="text-sm text-slate-600">Simple. Flexible. Effective.</p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#ea580c] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 flex justify-center">
            <img
              src="/assets/savvvn-ui/books-cap.png"
              alt="Graduation cap on stacked books"
              referrerPolicy="no-referrer"
              className="w-48 sm:w-52 h-auto object-contain"
            />
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
              <Users className="w-6 h-6 text-[#4F1CEB]" />
              <span className="text-xs font-semibold text-[#0F172A]">Learners</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
              <Video className="w-6 h-6 text-[#6366F1]" />
              <span className="text-xs font-semibold text-[#0F172A]">Courses</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
              <Trophy className="w-6 h-6 text-[#FF6B00]" />
              <span className="text-xs font-semibold text-[#0F172A]">Success</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
              <Star className="w-6 h-6 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#0F172A]">Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Our Students Our Inspiration + Frequently Asked Questions */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Card */}
          <div className="lg:col-span-6 bg-[#F4F3FF] rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-center">
            <div className="sm:col-span-6 h-56 sm:h-full">
              <img
                src="/assets/savvvn-ui/student-inspiration.jpg"
                alt="Student writing notes"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover block"
              />
            </div>

            <div className="sm:col-span-6 p-6 space-y-4">
              <h2 className="font-display text-2xl font-extrabold text-[#0F172A] leading-snug">
                <span className="block">Our Students</span>
                <span className="block">Our Inspiration</span>
              </h2>
              <button
                type="button"
                onClick={scrollToPackages}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#ea580c] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Right FAQ Accordion */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-3">
            <h2 className="font-display text-2xl font-extrabold text-[#0F172A]">
              Frequently Asked Questions
            </h2>

            <div className="space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left text-sm font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-50/70"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-[#0F172A] shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#0F172A] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 9. What Our Students Say */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-14 sm:w-28 bg-gradient-to-r from-transparent to-[#4F1CEB]/40" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] text-center whitespace-nowrap">
            What Our Students Say
          </h2>
          <span className="h-px w-14 sm:w-28 bg-gradient-to-l from-transparent to-[#4F1CEB]/40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            '/assets/savvvn-ui/avatar-1.jpg',
            '/assets/savvvn-ui/avatar-2.jpg',
            '/assets/savvvn-ui/avatar-3.jpg',
          ].map((avatarSrc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
            >
              <img
                src={avatarSrc}
                alt={`SavvvnLab student ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-100"
              />
              <div className="flex-1 space-y-2" aria-hidden="true">
                <div className="h-2.5 rounded-full bg-slate-200/80 w-11/12" />
                <div className="h-2 rounded-full bg-slate-200/60 w-4/5" />
                <div className="h-2 rounded-full bg-slate-200/60 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
