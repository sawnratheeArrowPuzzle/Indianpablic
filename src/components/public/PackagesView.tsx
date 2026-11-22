import React from 'react';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import type { Course, Package, PublicCatalogResponse } from '../../types/savvvn';

interface PackagesPageProps {
  catalog: PublicCatalogResponse;
  onSelectPackage: (pkg: Package) => void;
  onBuyPackage: (pkg: Package) => void;
}

export const PackagesPage: React.FC<PackagesPageProps> = ({
  catalog,
  onSelectPackage,
  onBuyPackage,
}) => {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B1E36] tracking-tight">
          Learning Packages
        </h1>
        <p className="text-base text-slate-600">
          Select any SavvvnLab package to view included courses, curriculum details, and proceed securely to UPI checkout.
        </p>
      </div>

      {catalog.packages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No learning packages are currently published.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {catalog.packages.map((pkg) => (
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
              <div className="sm:col-span-5 aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100">
                {pkg.coverImageUrl ? (
                  <img
                    src={pkg.coverImageUrl}
                    alt={pkg.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0B1530] via-[#1E293B] to-[#4F1CEB] flex items-center justify-center p-4 text-center">
                    <span className="font-display text-base font-bold text-white">
                      {pkg.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-7 flex flex-col justify-center space-y-2.5">
                <h2 className="font-display text-xl font-bold text-[#0F172A]">{pkg.name}</h2>
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
    </div>
  );
};

interface PackageDetailPageProps {
  pkg: Package;
  catalog: PublicCatalogResponse;
  onBack: () => void;
  onBuyPackage: (pkg: Package) => void;
}

export const PackageDetailPage: React.FC<PackageDetailPageProps> = ({
  pkg,
  catalog,
  onBack,
  onBuyPackage,
}) => {
  const includedCourses = catalog.packageCourses
    .filter((pc) => pc.packageId === pkg.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((pc) => catalog.courses.find((c) => c.id === pc.courseId))
    .filter((c): c is Course => Boolean(c));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0B1E36] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all packages</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {pkg.coverImageUrl && (
              <div className="aspect-[16/10] w-full border-b border-slate-200 bg-slate-100">
                <img
                  src={pkg.coverImageUrl}
                  alt={pkg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover block"
                />
              </div>
            )}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="text-xs font-medium text-[#0D9488]">
                {pkg.subtitle} · {includedCourses.length} Included Courses
              </div>
            <h1 className="font-display text-3xl font-bold text-[#0B1E36] tracking-tight">
              {pkg.name}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">{pkg.description}</p>

            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-[#0B1E36] mb-3">What You Get</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pkg.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#0B1E36]">
              Included Courses & Lesson Breakdown
            </h2>
            {includedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      {course.category} · {course.level} · {course.instructor}
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#0B1E36] mt-0.5">
                      {course.title}
                    </h3>
                  </div>
                  <span className="font-mono-num text-xs text-slate-500 shrink-0">
                    {course.lessons.length} Lessons
                  </span>
                </div>

                <p className="text-sm text-slate-600">{course.description}</p>

                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {course.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="py-2.5 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="text-slate-700">
                        <span className="font-mono-num text-xs text-slate-400 mr-2">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {lesson.title}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs font-mono-num text-slate-500 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <div className="text-xs text-slate-500">One-Time Enrollment</div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="font-mono-num text-3xl font-bold text-[#0B1E36]">
                ₹{pkg.price.toLocaleString('en-IN')}
              </span>
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <span className="font-mono-num text-sm text-slate-400 line-through">
                  ₹{pkg.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 border-y border-slate-100 py-4">
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span className="font-semibold text-[#0B1E36]">Verified UPI</span>
            </div>
            <div className="flex justify-between">
              <span>Included Courses</span>
              <span className="font-mono-num font-semibold text-[#0B1E36]">
                {includedCourses.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Partner Commission Rate</span>
              <span className="font-mono-num font-semibold text-[#0D9488]">
                {pkg.commissionRate}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onBuyPackage(pkg)}
            className="w-full py-3 px-5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Buy Now · Continue to UPI</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-500 leading-relaxed">
            Access unlocks immediately after an administrator verifies your submitted UTR reference and payment screenshot.
          </p>
        </aside>
      </div>
    </div>
  );
};
