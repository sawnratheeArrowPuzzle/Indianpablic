import React, { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Crop,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { deletePackageCoverByUrl, uploadPackageCover } from '../../lib/firebase';
import { PackageCoverCropModal } from './PackageCoverCropModal';
import type { AdminOverviewResponse, Course, CourseLesson, Package } from '../../types/savvvn';

interface SharedAdminProps {
  data: AdminOverviewResponse;
  onReload: () => Promise<void>;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const AdminPackagesManager: React.FC<SharedAdminProps> = ({ data, onReload }) => {
  const [editing, setEditing] = useState<Partial<Package> | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [benefitsText, setBenefitsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedPackages = [...data.packages].sort((a, b) => a.sortOrder - b.sortOrder);

  const openNew = () => {
    setEditing({
      name: '',
      subtitle: '',
      description: '',
      price: 499,
      originalPrice: undefined,
      commissionRate: data.settings.defaultCommissionPercent,
      coverImageUrl: '',
      featured: false,
      active: true,
      sortOrder: sortedPackages.length + 1,
    });
    setSelectedCourseIds([]);
    setBenefitsText('');
    setLastSelectedFile(null);
    setMsg(null);
  };

  const openEdit = (pkg: Package) => {
    setEditing({ ...pkg });
    const mappedIds = data.packageCourses
      .filter((pc) => pc.packageId === pkg.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((pc) => pc.courseId);
    setSelectedCourseIds(mappedIds);
    setBenefitsText(pkg.benefits.join('\n'));
    setLastSelectedFile(null);
    setMsg(null);
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setMsg('Unsupported format. Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg('Selected image exceeds 10 MB. Please choose a smaller file.');
      return;
    }
    setMsg(null);
    setLastSelectedFile(file);
    setCropSourceFile(file);
  };

  const handleCropConfirmed = async (blob: Blob, mimeType: string) => {
    if (!editing) return;
    setCropSourceFile(null);
    setUploadingCover(true);
    setMsg(null);
    try {
      const previousUrl = editing.coverImageUrl || '';
      const key = editing.id || editing.name || 'package';
      const downloadUrl = await uploadPackageCover(key, blob, mimeType);
      setEditing((prev) => (prev ? { ...prev, coverImageUrl: downloadUrl } : prev));
      if (previousUrl && previousUrl !== downloadUrl) {
        await deletePackageCoverByUrl(previousUrl);
      }
    } catch (err: any) {
      setMsg(err?.message || 'Could not upload cropped cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!editing) return;
    const currentUrl = editing.coverImageUrl || '';
    setEditing({ ...editing, coverImageUrl: '' });
    setLastSelectedFile(null);
    if (currentUrl) {
      await deletePackageCoverByUrl(currentUrl);
    }
  };

  const toggleCourseMapping = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMsg(null);
    const payload: Partial<Package> & { courseIds: string[] } = {
      ...editing,
      coverImageUrl: editing.coverImageUrl || '',
      benefits: benefitsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      courseIds: selectedCourseIds,
    };
    try {
      if (editing.id) {
        await api.updatePackage(editing.id, payload);
      } else {
        await api.createPackage(payload);
      }
      setEditing(null);
      await onReload();
    } catch (err: any) {
      setMsg(err?.message || 'Failed to save package');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickToggle = async (pkg: Package, patch: Partial<Package>) => {
    setBusy(true);
    setMsg(null);
    try {
      await api.updatePackage(pkg.id, patch);
      await onReload();
    } catch (err: any) {
      setMsg(err?.message || 'Failed to update package');
    } finally {
      setBusy(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sortedPackages.length) return;
    const nextOrder = [...sortedPackages];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIdx, 0, moved);
    setBusy(true);
    setMsg(null);
    try {
      await api.reorderPackages(nextOrder.map((p) => p.id));
      await onReload();
    } catch (err: any) {
      setMsg(err?.message || 'Failed to update package display order');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (pkg: Package) => {
    setBusy(true);
    setMsg(null);
    try {
      if (pkg.coverImageUrl) {
        await deletePackageCoverByUrl(pkg.coverImageUrl);
      }
      await api.deletePackage(pkg.id);
      await onReload();
    } catch (err: any) {
      setMsg(err?.message || 'Failed to delete package');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0B1E36]">Manage Packages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload package covers to Firebase Storage, reorder display position, or hide/enable packages publicly.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Package</span>
        </button>
      </div>

      {cropSourceFile && (
        <PackageCoverCropModal
          sourceFile={cropSourceFile}
          onCancel={() => setCropSourceFile(null)}
          onConfirm={handleCropConfirmed}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChosen}
        className="hidden"
      />

      {msg && !editing && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-display text-base font-bold text-[#0B1E36]">
              {editing.id ? `Edit ${editing.name}` : 'Add New Package'}
            </div>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-medium text-slate-500 hover:text-[#0B1E36] cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Package Cover Upload + Crop + Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-[#0B1E36]">
                  Package Cover Image (JPG, PNG, WebP · 16:10)
                </div>
                <div className="text-[11px] text-slate-500">
                  Stored securely in Firebase Storage and displayed on public package cards.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{editing.coverImageUrl ? 'Replace Cover' : 'Upload Cover'}</span>
                </button>
                {lastSelectedFile && (
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => setCropSourceFile(lastSelectedFile)}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1E36] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Crop / Adjust</span>
                  </button>
                )}
                {editing.coverImageUrl && (
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={handleRemoveCover}
                    className="px-3 py-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            {uploadingCover ? (
              <div className="aspect-[16/10] max-w-sm rounded-lg border border-slate-200 bg-white flex flex-col items-center justify-center gap-2 text-xs text-slate-600">
                <div className="w-5 h-5 rounded-full border-2 border-[#0D9488] border-t-transparent animate-spin" />
                <span>Uploading cropped cover to Firebase Storage...</span>
              </div>
            ) : editing.coverImageUrl ? (
              <div className="max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img
                  src={editing.coverImageUrl}
                  alt={editing.name || 'Package cover preview'}
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[16/10] object-cover block"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm aspect-[16/10] rounded-lg border-2 border-dashed border-slate-300 bg-white hover:border-[#0D9488] flex flex-col items-center justify-center gap-2 text-xs text-slate-500 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-6 h-6 text-slate-400" />
                <span className="font-medium text-[#0B1E36]">Select Cover From Gallery / Computer</span>
                <span className="text-[11px] text-slate-400">JPG, PNG, or WebP</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Package Name</label>
              <input
                type="text"
                required
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Price (INR ₹)</label>
              <input
                type="number"
                min={1}
                required
                value={editing.price || ''}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                min={1}
                value={editing.sortOrder ?? 1}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={editing.subtitle || ''}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Original Price (Optional)</label>
              <input
                type="number"
                min={0}
                value={editing.originalPrice ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    originalPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                min={0}
                max={80}
                required
                value={editing.commissionRate ?? 25}
                onChange={(e) => setEditing({ ...editing, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description (shown on Package Detail page)</label>
            <textarea
              rows={2}
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Included Benefits (one per line)
              </label>
              <textarea
                rows={4}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Included Courses ({selectedCourseIds.length} selected)
              </label>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-36 overflow-y-auto bg-[#F8FAFC]">
                {data.courses.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500">No courses created yet.</div>
                ) : (
                  data.courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#0B1E36] hover:bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => toggleCourseMapping(course.id)}
                      />
                      <span className="truncate font-medium">{course.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active !== false}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              <span>Enabled & Visible on Public Website</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(editing.featured)}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
              />
              <span>Featured Package</span>
            </label>
          </div>

          {msg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy || uploadingCover}
              className="px-5 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Saving...' : 'Save Package'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sortedPackages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No packages created yet. Click Add Package to publish your first learning package.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedPackages.map((pkg, idx) => {
            const courseCount = data.packageCourses.filter((pc) => pc.packageId === pkg.id).length;
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl overflow-hidden flex flex-col justify-between ${
                  pkg.featured ? 'border-2 border-[#6D28D9]' : 'border border-slate-200'
                }`}
              >
                <div>
                  <div className="aspect-[16/10] w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
                    {pkg.coverImageUrl ? (
                      <img
                        src={pkg.coverImageUrl}
                        alt={pkg.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                        <ImageIcon className="w-6 h-6" />
                        <span>No Cover Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-slate-500">
                          Order #{pkg.sortOrder} · {pkg.active ? 'Visible' : 'Hidden'} · {courseCount} Courses
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#0B1E36] mt-0.5">
                          {pkg.name}
                        </h3>
                      </div>
                      <span className="font-mono-num text-xl font-bold text-[#0B1E36] shrink-0">
                        ₹{pkg.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={busy || idx === 0}
                      onClick={() => handleMoveOrder(idx, -1)}
                      title="Move earlier"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0B1E36] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || idx === sortedPackages.length - 1}
                      onClick={() => handleMoveOrder(idx, 1)}
                      title="Move later"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0B1E36] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleQuickToggle(pkg, { active: !pkg.active })}
                      title={pkg.active ? 'Hide package' : 'Enable package'}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0B1E36] cursor-pointer"
                    >
                      {pkg.active ? <Eye className="w-3.5 h-3.5 text-[#16A34A]" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleQuickToggle(pkg, { featured: !pkg.featured })}
                      title={pkg.featured ? 'Unfeature' : 'Feature package'}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#6D28D9] cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          pkg.featured ? 'fill-[#6D28D9] text-[#6D28D9]' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(pkg)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1E36] cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(pkg)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AdminCoursesAndMappingManager: React.FC<SharedAdminProps> = ({ data, onReload }) => {
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(data.packages[0]?.id || '');
  const [busy, setBusy] = useState(false);

  const openNewCourse = () => {
    setEditingCourse({
      title: '',
      category: 'Video Editing',
      description: '',
      instructor: 'SavvvnLab Faculty',
      level: 'Beginner',
      thumbnail: '/src/assets/images/course_video_editing_1795281750455.jpg',
      active: true,
    });
    setLessons([
      {
        id: `les-${Date.now()}`,
        title: 'Module 1: Introduction',
        duration: '12:00',
        videoUrl: '',
        summary: 'Course overview and setup.',
        order: 1,
      },
    ]);
  };

  const openEditCourse = (c: Course) => {
    setEditingCourse({ ...c });
    setLessons([...c.lessons]);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setBusy(true);
    try {
      const payload = { ...editingCourse, lessons };
      if (editingCourse.id) {
        await api.updateCourse(editingCourse.id, payload);
      } else {
        await api.createCourse(payload);
      }
      setEditingCourse(null);
      await onReload();
    } finally {
      setBusy(false);
    }
  };

  const toggleCourseInPackage = async (courseId: string) => {
    if (!selectedPkgId) return;
    const currentIds = data.packageCourses
      .filter((pc) => pc.packageId === selectedPkgId)
      .map((pc) => pc.courseId);
    const nextIds = currentIds.includes(courseId)
      ? currentIds.filter((id) => id !== courseId)
      : [...currentIds, courseId];
    setBusy(true);
    try {
      await api.updatePackageCourses(selectedPkgId, nextIds);
      await onReload();
    } finally {
      setBusy(false);
    }
  };

  const mappedCourseIds = new Set(
    data.packageCourses.filter((pc) => pc.packageId === selectedPkgId).map((pc) => pc.courseId)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-[#0B1E36]">Courses & Lessons</h2>
        <button
          type="button"
          onClick={openNewCourse}
          className="px-4 py-2 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {editingCourse && (
        <form onSubmit={handleSaveCourse} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="font-display text-base font-bold text-[#0B1E36]">
            {editingCourse.id ? `Edit Course: ${editingCourse.title}` : 'Create New Course'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={editingCourse.title || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={editingCourse.category || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Instructor</label>
              <input
                type="text"
                value={editingCourse.instructor || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Level</label>
              <select
                value={editingCourse.level || 'Beginner'}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    level: e.target.value as Course['level'],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={editingCourse.description || ''}
              onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0B1E36]">Course Lessons</span>
              <button
                type="button"
                onClick={() =>
                  setLessons([
                    ...lessons,
                    {
                      id: `les-${Date.now()}-${lessons.length + 1}`,
                      title: '',
                      duration: '15:00',
                      videoUrl: '',
                      summary: '',
                      order: lessons.length + 1,
                    },
                  ])
                }
                className="text-xs font-semibold text-[#0D9488] cursor-pointer"
              >
                + Add Lesson
              </button>
            </div>

            {lessons.map((les, idx) => (
              <div key={les.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Lesson Title"
                    value={les.title}
                    onChange={(e) => {
                      const next = [...lessons];
                      next[idx] = { ...les, title: e.target.value };
                      setLessons(next);
                    }}
                    className="sm:col-span-2 px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 15:00)"
                    value={les.duration}
                    onChange={(e) => {
                      const next = [...lessons];
                      next[idx] = { ...les, duration: e.target.value };
                      setLessons(next);
                    }}
                    className="px-3 py-1.5 rounded border border-slate-300 font-mono-num text-xs bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Lesson Video URL (optional)"
                    value={les.videoUrl || ''}
                    onChange={(e) => {
                      const next = [...lessons];
                      next[idx] = { ...les, videoUrl: e.target.value };
                      setLessons(next);
                    }}
                    className="px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Short summary"
                      value={les.summary}
                      onChange={(e) => {
                        const next = [...lessons];
                        next[idx] = { ...les, summary: e.target.value };
                        setLessons(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setLessons(lessons.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
            >
              {busy ? 'Saving...' : 'Save Course'}
            </button>
            <button
              type="button"
              onClick={() => setEditingCourse(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.courses.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500">
                {c.category} · {c.lessons.length} Lessons · {c.level}
              </div>
              <h3 className="font-display text-base font-bold text-[#0B1E36]">{c.title}</h3>
              <p className="text-xs text-slate-600">{c.description}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openEditCourse(c)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1E36] cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  await api.deleteCourse(c.id);
                  await onReload();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Package -> Course Mapping Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-[#0B1E36]">
              Assign Courses to Packages
            </h3>
            <p className="text-xs text-slate-500">
              Courses are never sold separately—select a package below to configure which courses it unlocks.
            </p>
          </div>
          <select
            value={selectedPkgId}
            onChange={(e) => setSelectedPkgId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-[#0B1E36]"
          >
            {data.packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.price})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.courses.map((c) => {
            const checked = mappedCourseIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => toggleCourseInPackage(c.id)}
                className={`p-3.5 rounded-lg border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  checked
                    ? 'border-[#0D9488] bg-teal-50/40 text-[#0B1E36]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.category}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    checked
                      ? 'bg-[#0D9488] border-[#0D9488] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AdminSettingsPanels: React.FC<
  SharedAdminProps & { mode: 'website' | 'upi' | 'commission' }
> = ({ data, onReload, mode }) => {
  const [form, setForm] = useState({ ...data.settings });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.updateSettings(form);
      await onReload();
      setMsg({ ok: true, text: 'Settings saved and applied.' });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || 'Failed to save settings' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <h2 className="font-display text-lg font-bold text-[#0B1E36]">
        {mode === 'website'
          ? 'Website & Community Settings'
          : mode === 'upi'
          ? 'UPI Payment Configuration'
          : 'Commission & Withdrawal Rules'}
      </h2>

      {mode === 'website' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Site Name</label>
              <input
                type="text"
                value={form.siteName}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Hero Headline</label>
            <input
              type="text"
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Hero Subtitle</label>
            <textarea
              rows={2}
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={form.supportPhone}
                onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp URL</label>
              <input
                type="url"
                value={form.whatsappUrl}
                onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telegram URL</label>
              <input
                type="url"
                value={form.telegramUrl}
                onChange={(e) => setForm({ ...form, telegramUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {mode === 'upi' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Official UPI ID (displayed at checkout)
            </label>
            <input
              type="text"
              required
              placeholder="yourbusiness@upi"
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payee Display Name</label>
            <input
              type="text"
              required
              value={form.upiPayeeName}
              onChange={(e) => setForm({ ...form, upiPayeeName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom Static QR Image URL (optional; leave blank for dynamic amount QR)
            </label>
            <input
              type="text"
              value={form.customUpiQrUrl}
              onChange={(e) => setForm({ ...form, customUpiQrUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Instructions</label>
            <textarea
              rows={3}
              value={form.upiInstructions}
              onChange={(e) => setForm({ ...form, upiInstructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </>
      )}

      {mode === 'commission' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Commission (%)
              </label>
              <input
                type="number"
                min={0}
                max={80}
                value={form.defaultCommissionPercent}
                onChange={(e) =>
                  setForm({ ...form, defaultCommissionPercent: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Min Withdrawal (₹)
              </label>
              <input
                type="number"
                min={1}
                value={form.minWithdrawal}
                onChange={(e) => setForm({ ...form, minWithdrawal: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Max Withdrawal (₹)
              </label>
              <input
                type="number"
                min={100}
                value={form.maxWithdrawal}
                onChange={(e) => setForm({ ...form, maxWithdrawal: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-num text-sm"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(form.autoApproveCommission)}
              onChange={(e) => setForm({ ...form, autoApproveCommission: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              Automatically approve referral commissions upon UPI payment approval (if unchecked, commissions stay Pending until manual admin approval)
            </span>
          </label>
        </>
      )}

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            msg.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="px-6 py-2.5 rounded-lg bg-[#0B1E36] text-white text-sm font-semibold cursor-pointer"
      >
        {busy ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

export const AdminCommunicationAndSecurity: React.FC<
  SharedAdminProps & { mode: 'offers' | 'notifications' | 'support' | 'security' }
> = ({ data, onReload, mode }) => {
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerHighlight, setOfferHighlight] = useState('');
  const [offerValid, setOfferValid] = useState('');

  const [ntfUserId, setNtfUserId] = useState('all');
  const [ntfTitle, setNtfTitle] = useState('');
  const [ntfMsg, setNtfMsg] = useState('');

  const [adminEmail, setAdminEmail] = useState('');
  const [replyMap, setReplyMap] = useState<Record<string, { status: 'open' | 'in_progress' | 'resolved'; text: string }>>({});
  const [busy, setBusy] = useState(false);

  if (mode === 'offers') {
    return (
      <div className="space-y-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.createOffer({
                title: offerTitle,
                description: offerDesc,
                highlight: offerHighlight,
                validUntil: offerValid,
              });
              setOfferTitle('');
              setOfferDesc('');
              setOfferHighlight('');
              setOfferValid('');
              await onReload();
            } finally {
              setBusy(false);
            }
          }}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-2xl"
        >
          <h2 className="font-display text-lg font-bold text-[#0B1E36]">Publish Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Offer Title"
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <input
              type="text"
              placeholder="Highlight (e.g. Weekend Bonus)"
              value={offerHighlight}
              onChange={(e) => setOfferHighlight(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <input
            type="text"
            placeholder="Valid Until (e.g. 30 Nov 2026)"
            value={offerValid}
            onChange={(e) => setOfferValid(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <textarea
            rows={2}
            required
            placeholder="Offer description"
            value={offerDesc}
            onChange={(e) => setOfferDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold cursor-pointer"
          >
            Publish Offer
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.offers.map((o) => (
            <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-5 flex justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#6D28D9]">
                  {o.highlight} · {o.validUntil}
                </div>
                <div className="font-display font-bold text-[#0B1E36]">{o.title}</div>
                <p className="text-xs text-slate-600 mt-1">{o.description}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await api.deleteOffer(o.id);
                  await onReload();
                }}
                className="text-xs font-semibold text-red-600 h-fit cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'notifications') {
    return (
      <div className="space-y-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.broadcastNotification({
                userId: ntfUserId,
                title: ntfTitle,
                message: ntfMsg,
              });
              setNtfTitle('');
              setNtfMsg('');
              await onReload();
            } finally {
              setBusy(false);
            }
          }}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-2xl"
        >
          <h2 className="font-display text-lg font-bold text-[#0B1E36]">Send Notification</h2>
          <select
            value={ntfUserId}
            onChange={(e) => setNtfUserId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            <option value="all">All Members (Broadcast)</option>
            {data.members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName} ({m.email})
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            placeholder="Notification Title"
            value={ntfTitle}
            onChange={(e) => setNtfTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <textarea
            rows={3}
            required
            placeholder="Message body"
            value={ntfMsg}
            onChange={(e) => setNtfMsg(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
          >
            Send Notification
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h3 className="font-display text-base font-bold text-[#0B1E36]">Recent Notifications</h3>
          {data.notifications.slice(0, 20).map((n) => (
            <div key={n.id} className="border-b border-slate-100 pb-3 text-xs">
              <div className="font-semibold text-[#0B1E36]">
                {n.title} <span className="font-normal text-slate-400">· Target: {n.userId}</span>
              </div>
              <p className="text-slate-600 mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'support') {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-[#0B1E36]">
          Support Tickets & Contact Inquiries ({data.tickets.length})
        </h2>
        {data.tickets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-500">
            No support tickets or contact inquiries yet.
          </div>
        ) : (
          data.tickets.map((t) => {
            const draft = replyMap[t.id] || { status: t.status, text: t.adminReply || '' };
            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      {t.name} ({t.email}) · {new Date(t.createdAt).toLocaleString('en-IN')}
                    </div>
                    <h3 className="font-display text-base font-bold text-[#0B1E36]">{t.subject}</h3>
                  </div>
                  <span className="text-xs font-semibold capitalize text-[#0D9488]">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{t.message}</p>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      setReplyMap({
                        ...replyMap,
                        [t.id]: { ...draft, status: e.target.value as any },
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Write official admin reply..."
                    value={draft.text}
                    onChange={(e) =>
                      setReplyMap({ ...replyMap, [t.id]: { ...draft, text: e.target.value } })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await api.replySupportTicket(t.id, {
                        status: draft.status,
                        adminReply: draft.text,
                      });
                      await onReload();
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-[#0B1E36]">
          Admin Security & Role Allowlist
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Only verified Google accounts on this server allowlist receive administrator permissions. The primary owner cannot be removed.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!adminEmail.trim()) return;
          setBusy(true);
          try {
            await api.updateAdminAllowlist('add', adminEmail.trim());
            setAdminEmail('');
            await onReload();
          } finally {
            setBusy(false);
          }
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          required
          placeholder="new-admin@gmail.com"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold cursor-pointer"
        >
          Grant Admin Role
        </button>
      </form>

      <div className="divide-y divide-slate-100 border-t border-slate-200">
        {data.adminAllowlist.map((email) => (
          <div key={email} className="py-3 flex items-center justify-between text-sm">
            <span className="font-mono-num text-[#0B1E36]">{email}</span>
            {email === 'sawnk340@gmail.com' ? (
              <span className="text-xs font-semibold text-[#6D28D9]">Primary Owner</span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await api.updateAdminAllowlist('remove', email);
                  await onReload();
                }}
                className="text-xs font-semibold text-red-600 cursor-pointer"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
