import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "../qr-code/useQRScanner";

interface TrailerScanStepProps {
  trailerCode: string;
  actionLabel: string;
  onConfirmed: () => void;
}

export default function TrailerScanStep({
  trailerCode,
  actionLabel,
  onConfirmed,
}: TrailerScanStepProps) {
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const hasConfirmed = useRef(false);
  const [lastCount, setLastCount] = useState(0);

  const {
    qrResults,
    isScanning,
    isLoading,
    canStartScanning,
    isSupported,
    error,
    startScanning,
    stopScanning,
    switchCamera,
    videoRef,
    canvasRef,
  } = useQRScanner({ facingMode: "environment", scanInterval: 150 });

  const handleCode = useCallback(
    (code: string) => {
      if (hasConfirmed.current) return;
      if (code.trim().toLowerCase() === trailerCode.trim().toLowerCase()) {
        hasConfirmed.current = true;
        stopScanning();
        setScanned(true);
        setTimeout(() => onConfirmed(), 1000);
      } else {
        toast.error(`Fel trailer skannad: ${code}. Förväntat: ${trailerCode}`);
      }
    },
    [trailerCode, stopScanning, onConfirmed],
  );

  useEffect(() => {
    if (qrResults.length > lastCount && qrResults.length > 0) {
      setLastCount(qrResults.length);
      handleCode(qrResults[qrResults.length - 1].data);
    }
  }, [qrResults, lastCount, handleCode]);

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    handleCode(manualCode.trim());
  };

  if (scanned) {
    return (
      <div className="bg-white rounded-xl shadow-card p-10 flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h2 className="text-xl font-bold">Trailer verifierad!</h2>
        <p className="text-muted-foreground text-sm">Laddar {actionLabel}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="text-xl font-bold mb-1">Skanna trailer</h2>
        <p className="text-sm text-muted-foreground">
          Skanna QR-koden på trailer <strong>{trailerCode}</strong> för att
          fortsätta med {actionLabel}.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="relative bg-black aspect-square">
          {isSupported === false ? (
            <div className="flex flex-col items-center justify-center h-full text-white gap-3 p-6">
              <CameraOff className="w-10 h-10 opacity-60" />
              <p className="text-center text-sm opacity-80">
                Kameran stöds inte
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
                  <Camera className="w-12 h-12 text-white/60" />
                  <p className="text-white/80 text-sm">
                    Tryck för att starta kameran
                  </p>
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-52">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error.message}
          </div>
        )}

        <div className="p-4 flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              disabled={!canStartScanning || isLoading}
              className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              Starta skanning
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="flex-1 h-12"
            >
              Stoppa
            </Button>
          )}
          {isScanning &&
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
              <Button
                onClick={switchCamera}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold mb-3">Ange kod manuellt</h3>
        <form onSubmit={handleManual} className="space-y-3">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={`T.ex. ${trailerCode}`}
            className="h-12"
          />
          <Button
            type="submit"
            variant="outline"
            className="w-full h-12"
            disabled={!manualCode.trim()}
          >
            Bekräfta
          </Button>
        </form>
      </div>
    </div>
  );
}
