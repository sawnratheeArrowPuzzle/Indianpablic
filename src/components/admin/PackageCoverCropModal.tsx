import React, { useEffect, useRef, useState } from 'react';
import { Crop, RotateCcw, ZoomIn, ZoomOut, X, Check } from 'lucide-react';

interface PackageCoverCropModalProps {
  sourceFile: File;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob, mimeType: string, previewDataUrl: string) => void;
}

const FRAME_W = 480;
const FRAME_H = 300; // 16:10 consistent package card aspect ratio
const EXPORT_W = 1280;
const EXPORT_H = 800;

export const PackageCoverCropModal: React.FC<PackageCoverCropModalProps> = ({
  sourceFile,
  onCancel,
  onConfirm,
}) => {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image safely from File
  useEffect(() => {
    const objectUrl = URL.createObjectURL(sourceFile);
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setLoadError(null);
    };
    img.onerror = () => {
      setLoadError('Could not read the selected image. Please pick a valid JPG, PNG, or WebP file.');
    };
    img.src = objectUrl;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [sourceFile]);

  const getBaseScale = (img: HTMLImageElement) => {
    const scaleX = FRAME_W / img.naturalWidth;
    const scaleY = FRAME_H / img.naturalHeight;
    return Math.max(scaleX, scaleY);
  };

  // Clamp pan offset so image always covers the 16:10 frame cleanly
  const clampOffset = (nextX: number, nextY: number, currentZoom: number, img: HTMLImageElement) => {
    const scale = getBaseScale(img) * currentZoom;
    const drawnW = img.naturalWidth * scale;
    const drawnH = img.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (drawnW - FRAME_W) / 2);
    const maxOffsetY = Math.max(0, (drawnH - FRAME_H) / 2);
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextX)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextY)),
    };
  };

  // Redraw interactive preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    ctx.fillStyle = '#0B1E36';
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);

    const scale = getBaseScale(imgEl) * zoom;
    const drawnW = imgEl.naturalWidth * scale;
    const drawnH = imgEl.naturalHeight * scale;
    const x = (FRAME_W - drawnW) / 2 + offset.x;
    const y = (FRAME_H - drawnH) / 2 + offset.y;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgEl, x, y, drawnW, drawnH);
  }, [imgEl, zoom, offset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging || !imgEl) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(clampOffset(rawX, rawY, zoom, imgEl));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(nextZoom);
    if (imgEl) {
      setOffset((prev) => clampOffset(prev.x, prev.y, nextZoom, imgEl));
    }
  };

  const handleApplyCrop = () => {
    if (!imgEl) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = EXPORT_W;
    exportCanvas.height = EXPORT_H;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const ratio = EXPORT_W / FRAME_W;
    const scale = getBaseScale(imgEl) * zoom * ratio;
    const drawnW = imgEl.naturalWidth * scale;
    const drawnH = imgEl.naturalHeight * scale;
    const x = (EXPORT_W - drawnW) / 2 + offset.x * ratio;
    const y = (EXPORT_H - drawnH) / 2 + offset.y * ratio;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgEl, x, y, drawnW, drawnH);

    const outMime =
      sourceFile.type === 'image/png'
        ? 'image/png'
        : sourceFile.type === 'image/webp'
        ? 'image/webp'
        : 'image/jpeg';

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) {
          setLoadError('Failed to process cropped image.');
          return;
        }
        const previewDataUrl = exportCanvas.toDataURL(outMime, 0.9);
        onConfirm(blob, outMime, previewDataUrl);
      },
      outMime,
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1E36]">
            <Crop className="w-4 h-4 text-[#0D9488]" />
            <span>Crop & Adjust Package Cover (16:10)</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close crop dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loadError ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {loadError}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                Drag image to adjust framing. Fixed 16:10 card proportion guarantees zero distortion on mobile and desktop.
              </p>

              <div className="w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-900 flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={FRAME_W}
                  height={FRAME_H}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="w-full max-w-[480px] aspect-[16/10] touch-none cursor-grab active:cursor-grabbing block"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleZoomChange(Math.max(1, Number((zoom - 0.15).toFixed(2))))}
                  aria-label="Zoom out"
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  className="flex-1 accent-[#0D9488] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleZoomChange(Math.min(3, Number((zoom + 0.15).toFixed(2))))}
                  aria-label="Zoom in"
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!imgEl || Boolean(loadError)}
            onClick={handleApplyCrop}
            className="px-5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Upload & Apply Cover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
