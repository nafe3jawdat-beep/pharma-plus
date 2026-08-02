import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { readBarcodes } from 'zxing-wasm/reader';

const FAST_NATIVE_FORMATS = ['ean_13', 'code_128', 'qr_code', 'data_matrix', 'upc_a', 'upc_e', 'ean_8'];
const FAST_WASM_FORMATS = ['EAN-13', 'Code128', 'QRCode', 'DataMatrix', 'UPC-A', 'UPC-E', 'EAN-8'];

function playScanSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {}
}

export default function BarcodeScanner({ open, onScan, onClose }) {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  
  // 💡 إضافة الـ Canvas المخفي لمعالجة الصور
  const hiddenCanvasRef = useRef(document.createElement('canvas'));
  
  const isScanningActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const lastCodeRef = useRef(null);
  const cooldownUntilRef = useRef(0);
  const nativeDetectorRef = useRef(null);

  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    readBarcodes(c, { formats: FAST_WASM_FORMATS, maxNumberOfSymbols: 1, tryHarder: false }).catch(() => {});
  }, []);

  const stopScanner = useCallback(() => {
    isScanningActiveRef.current = false;
    isProcessingRef.current = false;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setScanning(false);
    setTorchOn(false);
    setTorchSupported(false);
    lastCodeRef.current = null;
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
      } catch {
        /* torch unsupported */
      }
    }
  }, [torchOn]);

  // 🚀 دالة المعالجة الجذرية باستخدام الـ Canvas المخفي
  const processFrame = useCallback(async () => {
    if (!isScanningActiveRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const now = performance.now();

    // فحص إطار كل 150 مللي ثانية (6 إطارات بالثانية كافية جداً)
    if (
      video.readyState === video.HAVE_ENOUGH_DATA &&
      !isProcessingRef.current &&
      now - lastScanTimeRef.current > 80 &&
      now >= cooldownUntilRef.current
    ) {
      isProcessingRef.current = true;
      lastScanTimeRef.current = now;

      try {
        // 1. حساب منطقة الاقتطاع (المنطقة الوسطى التي يركز عليها المستخدم)
        const vW = video.videoWidth;
        const vH = video.videoHeight;
        
        // نأخذ 60% من مساحة الفيديو في المنتصف
        const scanAreaSize = Math.min(vW, vH) * 0.6;
        const startX = (vW - scanAreaSize) / 2;
        const startY = (vH - scanAreaSize) / 2;

        // 2. إعداد الـ Canvas لمعالجة سريعة (بحجم 300x300 فقط!)
        const canvas = hiddenCanvasRef.current;
        canvas.width = 200;
        canvas.height = 200;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.drawImage(
          video,
          startX, startY, scanAreaSize, scanAreaSize,
          0, 0, 200, 200
        );

        const imageData = ctx.getImageData(0, 0, 200, 200);
        let detectedCode = null;

        // المحرك المباشر (سريع جداً)
        if (nativeDetectorRef.current) {
          const barcodes = await nativeDetectorRef.current.detect(imageData);
          if (barcodes.length > 0) detectedCode = barcodes[0].rawValue;
        } 
        // المحرك الاحتياطي
        else {
          const results = await readBarcodes(imageData, {
            formats: FAST_WASM_FORMATS,
            maxNumberOfSymbols: 1,
            tryHarder: false,
          });
          if (results && results.length > 0) detectedCode = results[0].text;
        }

        if (detectedCode && detectedCode !== lastCodeRef.current) {
          lastCodeRef.current = detectedCode;
          playScanSound();
          onScan(detectedCode);
          cooldownUntilRef.current = performance.now() + 2000;
          setTimeout(() => { lastCodeRef.current = null; }, 2000);
          isProcessingRef.current = false;
        }
      } finally {
        isProcessingRef.current = false;
      }
    }

    if (isScanningActiveRef.current) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [onScan]);

  const startCamera = useCallback(
    async (deviceId) => {
      stopScanner();
      setError('');
      setScanning(true);

      if ('BarcodeDetector' in window) {
        try {
          nativeDetectorRef.current = new window.BarcodeDetector({ formats: FAST_NATIVE_FORMATS });
        } catch {
          nativeDetectorRef.current = null;
        }
      } else {
        nativeDetectorRef.current = null;
      }

      try {
        // تم تخفيف القيود تماماً لحل مشكلة الشاشة الخضراء DroidCam
        const constraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'environment' } // أزلنا الـ ideal dimensions تماماً ليختار المتصفح الأنسب
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          const track = stream.getVideoTracks()[0];
          if (track && typeof track.getCapabilities === 'function') {
            const capabilities = track.getCapabilities();
            setTorchSupported(!!capabilities.torch);
          }

          isScanningActiveRef.current = true;
          cooldownUntilRef.current = performance.now() + 1000;
          animFrameRef.current = requestAnimationFrame(processFrame);
        }
      } catch (err) {
        setScanning(false);
        setError(err.name === 'NotAllowedError' ? t('scanner.permissionDenied') : t('scanner.error'));
      }
    },
    [processFrame, stopScanner, t]
  );

  // ... (باقي كود الـ useEffect و الـ UI يبقى كما هو تماماً بدون تغيير)
  // سأرفق لك جزء الـ useEffect والـ Return لتكون النسخة مكتملة للنسخ واللصق

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    let isMounted = true;
    const initCameras = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) {
          setError(t('scanner.noCamera'));
          return;
        }

        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        tempStream.getTracks().forEach((tr) => tr.stop());

        if (!isMounted) return;

        const videoDevices = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({ id: d.deviceId, label: d.label || 'Camera' }));

        if (videoDevices.length === 0) {
          setError(t('scanner.noCamera'));
          return;
        }

        setCameras(videoDevices);
        const backCam = videoDevices.find((d) =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
        );
        const initialCamId = backCam ? backCam.id : videoDevices[0].id;
        setSelectedCamera(initialCamId);

        startCamera(initialCamId);
      } catch (err) {
        if (isMounted) setError(err.name === 'NotAllowedError' ? t('scanner.permissionDenied') : t('scanner.noCamera'));
      }
    };

    initCameras();
    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [open, startCamera, stopScanner, t]);

  const handleCameraSwitch = async (cameraId) => {
    setSelectedCamera(cameraId);
    await startCamera(cameraId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { stopScanner(); onClose(); }} />

      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-surface-container-high z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">barcode_scanner</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">{t('scanner.title')}</h3>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3] overflow-hidden">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-white/60 animate-pulse">videocam</span>
                <span className="text-xs text-white/60">{t('scanner.initializing')}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest p-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-rose-500">videocam_off</span>
                </div>
                <p className="text-xs font-medium text-on-surface">{error}</p>
              </div>
            </div>
          )}

          {scanning && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[85%] h-[65%] border border-white/30 rounded-2xl bg-black/10 backdrop-brightness-110">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
                <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-primary shadow-[0_0_12px_#3b82f6] animate-pulse" />
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-auto z-10">
            {torchSupported && scanning && (
              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                  torchOn ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40' : 'bg-black/60 text-white/80 hover:bg-black/80 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg block">{torchOn ? 'flashlight_on' : 'flashlight_off'}</span>
              </button>
            )}

            {cameras.length > 1 && scanning && (
              <button
                onClick={() => {
                  const idx = cameras.findIndex((c) => c.id === selectedCamera);
                  handleCameraSwitch(cameras[(idx + 1) % cameras.length].id);
                }}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:bg-black/80 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-lg block">flip_camera_ios</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4 text-center">
          <p className="text-xs font-medium text-on-surface-variant mb-1">{t('scanner.holdSteady')}</p>
          <p className="text-[11px] text-on-surface-variant/70 mb-3">وجه الباركود داخل الإطار في منتصف الشاشة</p>
        </div>
      </div>
    </div>
  );
}