import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Camera, CameraOff, RotateCcw, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useListTrailers } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";

export default function ScanPage() {
  const navigate = useNavigate();
  const { data: trailers } = useListTrailers();
  const [manualCode, setManualCode] = useState("");
  const hasNavigated = useRef(false);
  const [lastResultCount, setLastResultCount] = useState(0);

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

  const findAndNavigate = useCallback(
    (code: string) => {
      if (hasNavigated.current) return;
      if (!trailers) return;
      const idx = trailers.findIndex(
        (t) => t.code.toLowerCase() === code.toLowerCase(),
      );
      if (idx >= 0) {
        hasNavigated.current = true;
        stopScanning();
        navigate({
          to: "/trailer/$id",
          params: { id: trailers[idx].id.toString() },
        });
      } else {
        toast.error(`Ingen trailer hittades med kod: ${code}`);
      }
    },
    [trailers, navigate, stopScanning],
  );

  useEffect(() => {
    if (qrResults.length > lastResultCount && qrResults.length > 0) {
      setLastResultCount(qrResults.length);
      findAndNavigate(qrResults[0].data);
    }
  }, [qrResults, lastResultCount, findAndNavigate]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) findAndNavigate(manualCode.trim());
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Skanna QR-kod</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rikta kameran mot en trailer-kod
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="relative bg-black aspect-square">
          {isSupported === false ? (
            <div className="flex flex-col items-center justify-center h-full text-white gap-3 p-6">
              <CameraOff className="w-10 h-10 opacity-60" />
              <p className="text-center text-sm opacity-80">
                Kameran stöds inte på den här enheten
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
          <div
            data-ocid="scanner.error_state"
            className="px-4 py-2 bg-destructive/10 text-destructive text-sm"
          >
            {error.message}
          </div>
        )}

        <div className="p-4 flex gap-2">
          {!isScanning ? (
            <Button
              data-ocid="scanner.start.primary_button"
              onClick={startScanning}
              disabled={!canStartScanning || isLoading}
              className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              Starta skanning
            </Button>
          ) : (
            <Button
              data-ocid="scanner.stop.button"
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
                data-ocid="scanner.switch.button"
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
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <Label htmlFor="manual-code">Trailer-kod</Label>
            <Input
              data-ocid="scanner.manual.input"
              id="manual-code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="T.ex. T-001"
              className="mt-1 h-12"
            />
          </div>
          <Button
            data-ocid="scanner.manual.submit_button"
            type="submit"
            variant="outline"
            className="w-full h-12"
            disabled={!manualCode.trim()}
          >
            Sök trailer
          </Button>
        </form>
      </div>
    </div>
  );
}
