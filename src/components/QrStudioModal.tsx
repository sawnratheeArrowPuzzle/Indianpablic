import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import jsQR from 'jsqr';
import {
  QrCode,
  Scan,
  Download,
  Copy,
  Check,
  Globe,
  FileText,
  User,
  Wifi,
  CreditCard,
  Camera,
  Upload,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
  Layers,
  Sliders,
  Share2,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { LionEmblemSvg } from './LionEmblemSvg';
import { AshokaChakraSvg } from './AshokaChakraSvg';

interface QrStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type QrType = 'url' | 'text' | 'contact' | 'wifi' | 'upi';
type ActiveTab = 'generator' | 'scanner';

export const QrStudioModal: React.FC<QrStudioModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');

  // Generator State
  const [qrType, setQrType] = useState<QrType>('url');
  const [urlInput, setUrlInput] = useState('https://indianpublic.netlify.app/');
  const [textInput, setTextInput] = useState('Happy Independence Day 2026 - Proud Indian Citizen');
  
  // Contact State
  const [contactName, setContactName] = useState('Sawn Kumar');
  const [contactPhone, setContactPhone] = useState('9876543897');
  const [contactEmail, setContactEmail] = useState('contact@indianpublic.org');
  const [contactOrg, setContactOrg] = useState('Government of India');

  // WiFi State
  const [wifiSsid, setWifiSsid] = useState('Digital_India_WiFi');
  const [wifiPassword, setWifiPassword] = useState('Bharat@2026');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // UPI State
  const [upiId, setUpiId] = useState('bharat@upi');
  const [upiName, setUpiName] = useState('Digital India Portal');
  const [upiAmount, setUpiAmount] = useState('');

  // Styling & Customization State
  const [fgColor, setFgColor] = useState('#0B1E36');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [includeMargin, setIncludeMargin] = useState(true);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrSize, setQrSize] = useState<number>(260);
  const [includeCenterBadge, setIncludeCenterBadge] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Scanner State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('Ready to scan');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hiddenCanvasQrRef = useRef<HTMLDivElement | null>(null);

  // Build string data for QR code generator
  const getQrValue = (): string => {
    switch (qrType) {
      case 'url':
        return urlInput.trim() || 'https://indianpublic.netlify.app/';
      case 'text':
        return textInput || 'Indian Public Portal';
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${contactName}\nFN:${contactName}\nORG:${contactOrg}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`;
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case 'upi':
        return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}${upiAmount ? `&am=${encodeURIComponent(upiAmount)}` : ''}&cu=INR`;
      default:
        return 'https://indianpublic.netlify.app/';
    }
  };

  // Copy text helper
  const handleCopyText = (text: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedToast(label);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Download QR Code as PNG
  const handleDownloadPng = () => {
    try {
      const container = hiddenCanvasQrRef.current;
      if (!container) return;
      const canvas = container.querySelector('canvas');
      if (!canvas) return;

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `IndianPublic_QRCode_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setCopiedToast('QR Code PNG Downloaded!');
      setTimeout(() => setCopiedToast(null), 2500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Stop camera stream safely
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start camera stream safely
  const startCamera = async (currentFacing: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setScannerStatus('Requesting camera access...');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by your browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setScannerStatus('Scanning QR code in real-time...');
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in browser settings or upload an image below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on this system. You can upload a QR image file below to scan.';
      } else {
        message = err.message || 'Camera permission denied or camera not accessible in current iframe. Use image upload to scan.';
      }
      setCameraError(message);
      setCameraActive(false);
      setScannerStatus('Camera unavailable');
    }
  };

  // Continuously scan video frames using jsQR
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        setScannedResult(code.data);
        setScannerStatus('QR Code Detected Successfully!');
        // Keep camera running or pause
        stopCamera();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Scan uploaded image file using jsQR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerStatus('Analyzing uploaded image...');
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setCameraError('Failed to process image canvas.');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          setScannedResult(code.data);
          setScannerStatus('QR Code decoded from uploaded image!');
        } else {
          setCameraError('No valid QR code found in the selected image. Please choose a clearer image.');
          setScannerStatus('Scan failed');
        }
      };
      img.onerror = () => {
        setCameraError('Failed to load selected image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Toggle camera switch
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  // Lifecycle when tab changes or modal closes
  useEffect(() => {
    if (!isOpen || activeTab !== 'scanner') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Detect if scanned result is a safe URL
  const isUrl = scannedResult ? /^(http|https):\/\/[^ "]+$/.test(scannedResult.trim()) : false;

  return (
    <div
      id="qr-studio-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-[#FAF7F0] border-2 border-amber-900/20 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-[#FFFDF9] border-b border-amber-900/15 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-900">
              <QrCode className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36]">
                  QR Code Studio • जनरेटर एवं स्कैनर
                </h2>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Digital India Tool
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generate High-Definition QR Codes & Instant Camera/Image QR Scanner
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-qr-studio-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {copiedToast && (
          <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-center space-x-2 animate-fade-in shadow-inner">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{copiedToast}</span>
          </div>
        )}

        {/* TOP MODE TOGGLE TABS */}
        <div className="bg-[#FAF4E6] border-b border-amber-900/10 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-amber-200/50 p-1 rounded-xl border border-amber-900/15 w-full sm:w-auto">
            <button
              type="button"
              id="tab-qr-generator"
              onClick={() => {
                stopCamera();
                setActiveTab('generator');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'generator'
                  ? 'bg-gradient-to-r from-[#0B1E36] to-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>1. QR Code Generator (बनाएं)</span>
            </button>

            <button
              type="button"
              id="tab-qr-scanner"
              onClick={() => {
                setActiveTab('scanner');
                setScannedResult(null);
                startCamera();
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <Scan className="w-4 h-4 text-emerald-300" />
              <span>2. QR Code Scanner (स्कैन करें)</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
            <AshokaChakraSvg size={14} color="#000080" />
            <span>सुरक्षित एवं बिना डेटा संग्रह (100% Client-Side Safe)</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: QR CODE GENERATOR */}
          {activeTab === 'generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Input & Customization (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* QR Data Type Selectors */}
                <div className="bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-3.5 shadow-2xs">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Data Format (डेटा का प्रकार चुनें):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => setQrType('url')}
                      className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all border text-xs font-bold ${
                        qrType === 'url'
                          ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <Globe className="w-4 h-4 mb-1 text-blue-500" />
                      <span>URL Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrType('text')}
                      className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all border text-xs font-bold ${
                        qrType === 'text'
                          ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <FileText className="w-4 h-4 mb-1 text-amber-500" />
                      <span>Text / SMS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrType('contact')}
                      className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all border text-xs font-bold ${
                        qrType === 'contact'
                          ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <User className="w-4 h-4 mb-1 text-emerald-500" />
                      <span>vCard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrType('upi')}
                      className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all border text-xs font-bold ${
                        qrType === 'upi'
                          ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1 text-purple-500" />
                      <span>UPI Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrType('wifi')}
                      className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all border text-xs font-bold ${
                        qrType === 'wifi'
                          ? 'bg-[#0B1E36] text-white border-[#0B1E36] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <Wifi className="w-4 h-4 mb-1 text-teal-500" />
                      <span>Wi-Fi</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC FORM INPUTS */}
                <div className="bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-4 shadow-2xs space-y-3">
                  {qrType === 'url' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Website / Page URL (वेबसाइट लिंक):
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Enter full website URL including https://
                      </p>
                    </div>
                  )}

                  {qrType === 'text' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Text Content / Message (टेक्स्ट या संदेश):
                      </label>
                      <textarea
                        rows={3}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type any message, note, student roll number or patriotic slogan..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                      />
                    </div>
                  )}

                  {qrType === 'contact' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name:</label>
                          <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. Sawn Kumar"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number:</label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. 9876543897"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address:</label>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. user@gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization / School:</label>
                          <input
                            type="text"
                            value={contactOrg}
                            onChange={(e) => setContactOrg(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. Government School"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {qrType === 'upi' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">UPI ID (VPA):</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                            placeholder="username@okhdfcbank"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Payee Name:</label>
                          <input
                            type="text"
                            value={upiName}
                            onChange={(e) => setUpiName(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. Digital India"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Optional Amount (₹):</label>
                        <input
                          type="number"
                          value={upiAmount}
                          onChange={(e) => setUpiAmount(e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                          placeholder="Leave blank for any amount"
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'wifi' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Network Name (SSID):</label>
                          <input
                            type="text"
                            value={wifiSsid}
                            onChange={(e) => setWifiSsid(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                            placeholder="Wi-Fi Name"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Password:</label>
                          <input
                            type="text"
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                            placeholder="Network Password"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STYLING & COLOR CUSTOMIZATION */}
                <div className="bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-700" />
                      <span>Custom Style & Colors (रंग व डिज़ाइन)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFgColor('#0B1E36');
                        setBgColor('#FFFFFF');
                        setIncludeCenterBadge(true);
                      }}
                      className="text-[10px] text-amber-800 font-bold hover:underline"
                    >
                      Reset Default
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* QR Code Color Palette */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Foreground Color (क्यूआर रंग):
                      </label>
                      <div className="flex items-center space-x-2">
                        {[
                          { name: 'Navy', hex: '#0B1E36' },
                          { name: 'Classic Black', hex: '#000000' },
                          { name: 'Tricolor Saffron', hex: '#D97706' },
                          { name: 'National Green', hex: '#138808' },
                          { name: 'Royal Blue', hex: '#1E3A8A' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setFgColor(c.hex)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              fgColor === c.hex ? 'scale-125 border-amber-500 shadow-xs' : 'border-white'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                        <input
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-7 h-7 p-0 border-0 rounded cursor-pointer"
                          title="Custom Color Picker"
                        />
                      </div>
                    </div>

                    {/* Badge Center Logo Toggle */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Center Emblem / Badge:
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeCenterBadge}
                          onChange={(e) => setIncludeCenterBadge(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span className="font-semibold text-[11.5px]">Add Ashoka Chakra Center Logo</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live QR Code Preview & Download (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full bg-[#FFFDF9] border-2 border-amber-900/20 rounded-3xl p-5 shadow-lg flex flex-col items-center text-center">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-montserrat font-bold text-xs text-[#0B1E36] uppercase tracking-wider">
                      Live Ultra HD QR Code Preview
                    </span>
                  </div>

                  {/* VISIBLE SVG QR CODE PREVIEW */}
                  <div
                    className="p-4 rounded-2xl bg-white border border-amber-900/20 shadow-md flex items-center justify-center relative my-2"
                    style={{ backgroundColor: bgColor }}
                  >
                    <QRCodeSVG
                      value={getQrValue()}
                      size={200}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level={includeCenterBadge ? 'H' : errorLevel}
                      includeMargin={includeMargin}
                      imageSettings={
                        includeCenterBadge
                          ? {
                              src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23000080"><circle cx="12" cy="12" r="10" stroke="%23000080" stroke-width="2" fill="white"/><circle cx="12" cy="12" r="2" fill="%23000080"/></svg>',
                              x: undefined,
                              y: undefined,
                              height: 38,
                              width: 38,
                              excavate: true,
                            }
                          : undefined
                      }
                    />

                    {includeCenterBadge && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-white border-2 border-[#000080] shadow-sm flex items-center justify-center">
                          <AshokaChakraSvg size={24} color="#000080" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HIDDEN HIGH-RES CANVAS FOR PNG DOWNLOAD */}
                  <div ref={hiddenCanvasQrRef} className="hidden">
                    <QRCodeCanvas
                      value={getQrValue()}
                      size={800}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level="H"
                      includeMargin={includeMargin}
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 font-mono break-all max-h-12 overflow-hidden px-2">
                    {getQrValue()}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-4 w-full space-y-2">
                    <button
                      type="button"
                      id="download-qr-png-btn"
                      onClick={handleDownloadPng}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B1E36] to-[#1E3A8A] hover:from-[#081526] hover:to-[#172554] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Download HD PNG (फुल क्वालिटी)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(getQrValue(), 'QR Content Copied to Clipboard!')}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-300 shadow-2xs transition-all active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Encoded Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE SCANNER */}
          {activeTab === 'scanner' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* LIVE CAMERA VIEWER BOX */}
              <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center">
                {/* Scanner Target Bounding Box / Laser Animation */}
                <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-700">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                      {/* Targeting Corner Brackets */}
                      <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative flex items-center justify-center shadow-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-md" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-md" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-md" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-md" />

                        {/* Animated Scanning Laser Line */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse" />
                      </div>
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <Camera className="w-12 h-12 text-slate-600 mb-2" />
                      <p className="text-xs font-semibold">{scannerStatus}</p>
                      {cameraError && (
                        <p className="text-[11px] text-amber-400 mt-2 max-w-xs leading-relaxed bg-amber-950/40 p-2 rounded-lg border border-amber-800">
                          {cameraError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* CAMERA CONTROLS STRIP */}
                <div className="mt-3 w-full flex items-center justify-between gap-2 px-2">
                  <div className="flex items-center space-x-2">
                    {cameraActive ? (
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all"
                      >
                        <span>Stop Camera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Start Camera (कैमरा चालू करें)</span>
                      </button>
                    )}

                    {cameraActive && (
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1 border border-slate-700 transition-all"
                        title="Switch Camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Switch</span>
                      </button>
                    )}
                  </div>

                  {/* UPLOAD QR IMAGE FALLBACK BUTTON */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload QR Image (गैलरी से)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SCANNED DECODED RESULT BOX */}
              {scannedResult ? (
                <div className="bg-[#FFFDF9] border-2 border-emerald-600/40 rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <span className="font-montserrat font-bold text-xs sm:text-sm text-[#0B1E36]">
                        Decoded QR Code Information (स्कैन किया गया डेटा)
                      </span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Verified
                    </span>
                  </div>

                  {/* Sanitized Content Display */}
                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl break-all select-all border border-slate-800 max-h-36 overflow-y-auto">
                    {scannedResult}
                  </div>

                  {/* Security Alert if external URL */}
                  {isUrl && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Security Notice (सुरक्षा सूचना):</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Always verify external links before proceeding. Make sure you trust the destination URL.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Scanned Result */}
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    {isUrl && (
                      <a
                        href={scannedResult}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Link Safely (लिंक खोलें)</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyText(scannedResult, 'Scanned Data Copied!')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center space-x-1.5 border border-slate-300 shadow-2xs transition-all"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Text (कॉपी करें)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScannedResult(null);
                        setScannerStatus('Ready to scan next QR code');
                        startCamera();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center space-x-1.5 transition-all ml-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Another QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-4 text-xs text-slate-600 flex items-start space-x-3 shadow-2xs">
                  <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0B1E36]">QR Scanner Tips:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Point your mobile or laptop camera towards any QR code. If camera access is restricted or unsupported in your current browser tab, click <strong>"Upload QR Image"</strong> to decode any screenshot or photo directly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#FAF4E6] border-t border-amber-900/15 px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <LionEmblemSvg size={18} color="#0B1E36" />
            <span className="font-semibold text-slate-700">Digital India Utility • QR Studio</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all"
          >
            Close (बंद करें)
          </button>
        </div>
      </div>
    </div>
  );
};
