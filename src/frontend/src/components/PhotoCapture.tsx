import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, SkipForward, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "../camera/useCamera";

interface PhotoCaptureProps {
  title: string;
  onPhotosConfirmed: (photos: File[]) => void;
  onSkip: () => void;
}

export default function PhotoCapture({
  title,
  onPhotosConfirmed,
  onSkip,
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<{ file: File; previewUrl: string }[]>(
    [],
  );
  const {
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    isActive,
    isLoading,
    error,
  } = useCamera({
    facingMode: "environment",
    quality: 0.85,
  });

  // Store stable refs to avoid exhaustive-deps issues with memoized callbacks
  const startCameraRef = useRef(startCamera);
  const stopCameraRef = useRef(stopCamera);
  startCameraRef.current = startCamera;
  stopCameraRef.current = stopCamera;

  useEffect(() => {
    startCameraRef.current();
    return () => {
      stopCameraRef.current();
    };
  }, []);

  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const handleCapture = async () => {
    if (photos.length >= 3) return;
    const file = await capturePhoto();
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.push(previewUrl);
    setPhotos((prev) => [...prev, { file, previewUrl }]);
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleConfirm = () => {
    onPhotosConfirmed(photos.map((p) => p.file));
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Valfritt — upp till 3 foton
        </p>
      </div>

      {/* Camera viewfinder */}
      <div className="relative bg-black" style={{ minHeight: 240 }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm">
            Startar kamera...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center px-4 gap-2">
            <Camera className="w-8 h-8 opacity-50" />
            <p className="text-sm font-semibold">Kameran kunde inte startas</p>
            <p className="text-xs opacity-80 mt-1">
              Kontrollera att du gett tillåtelse till kameran i webbläsaren och
              försök igen.
            </p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full object-cover"
          style={{ maxHeight: 320 }}
        />
        {isActive && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <button
              type="button"
              data-ocid="photo.capture.button"
              onClick={handleCapture}
              disabled={photos.length >= 3}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center shadow-lg"
              aria-label="Ta foto"
            >
              <div className="w-10 h-10 rounded-full bg-white" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="px-5 py-3 flex gap-2">
          {photos.map((p, i) => (
            <div
              key={p.previewUrl}
              data-ocid={`photo.thumbnail.item.${i + 1}`}
              className="relative rounded-lg overflow-hidden border border-border"
              style={{ width: 80, height: 60 }}
            >
              <img
                src={p.previewUrl}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                data-ocid={`photo.delete_button.${i + 1}`}
                onClick={() => handleRemove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Ta bort foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <div
              className="rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground"
              style={{ height: 60, width: 80 }}
            >
              +{3 - photos.length}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-5 pt-3 space-y-2">
        <Button
          data-ocid="photo.confirm.primary_button"
          onClick={handleConfirm}
          disabled={photos.length === 0}
          className="w-full text-base font-bold gap-2"
          style={{ height: 52 }}
        >
          <CheckCircle className="w-5 h-5" />
          Klar ({photos.length} foto{photos.length !== 1 ? "n" : ""})
        </Button>
        <Button
          data-ocid="photo.skip.button"
          variant="ghost"
          onClick={onSkip}
          className="w-full h-12 gap-2 text-muted-foreground"
        >
          <SkipForward className="w-4 h-4" />
          Hoppa över
        </Button>
      </div>
    </div>
  );
}
