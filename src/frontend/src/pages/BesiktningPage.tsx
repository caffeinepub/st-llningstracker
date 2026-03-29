import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PhotoCapture from "../components/PhotoCapture";
import TrailerScanStep from "../components/TrailerScanStep";
import {
  useCloseInspection,
  useListTrailers,
  useStartInspection,
} from "../hooks/useQueries";
import { uploadPhotos } from "../utils/uploadPhotos";

type Step = "scan" | "photo" | "save" | "final-scan" | "done";

export default function BesiktningPage() {
  // useParams with strict:false returns an object that may or may not have `id`
  const params = useParams({ strict: false }) as { id?: string };
  const paramId = params?.id;

  const { data: trailers } = useListTrailers();

  const [step, setStep] = useState<Step>(paramId ? "photo" : "scan");
  const [trailerId, setTrailerId] = useState<bigint | null>(
    paramId ? BigInt(paramId) : null,
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [comments, setComments] = useState("");
  const [uploading, setUploading] = useState(false);
  const [inspectionId, setInspectionId] = useState<bigint | null>(null);

  const { mutateAsync: startInspection, isPending: isStarting } =
    useStartInspection();
  const { mutateAsync: closeInspection, isPending: isClosing } =
    useCloseInspection();

  const trailer = trailers?.find((t) => t.id === trailerId);
  const trailerCode = trailer?.code ?? "";

  const handlePhotosConfirmed = (files: File[]) => {
    setPhotos(files);
    setStep("save");
  };

  const handlePhotoSkip = () => {
    setPhotos([]);
    setStep("save");
  };

  const handleStartInspection = async () => {
    if (!trailerId) return;
    setUploading(true);
    try {
      const hashes = await uploadPhotos(photos);
      const result = await startInspection({
        trailerId,
        photoHashes: hashes,
        comments,
      });
      setInspectionId(result as unknown as bigint);
      setStep("final-scan");
    } catch {
      toast.error("Kunde inte starta besiktning. Försök igen.");
    } finally {
      setUploading(false);
    }
  };

  const handleFinalScan = async () => {
    if (!inspectionId || !trailerCode) return;
    try {
      await closeInspection({ inspectionId, trailerCode });
      setStep("done");
      toast.success("Besiktning avslutad!");
    } catch {
      toast.error("Kunde inte avsluta besiktning.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Besiktning</h1>
          <p className="text-sm text-muted-foreground">
            Dokumentera kärrans skick
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-1.5">
        {(["scan", "photo", "save", "final-scan", "done"] as Step[]).map(
          (s, i) => {
            const steps: Step[] = [
              "scan",
              "photo",
              "save",
              "final-scan",
              "done",
            ];
            const currentIdx = steps.indexOf(step);
            return (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-colors ${
                  i <= currentIdx ? "bg-primary" : "bg-muted"
                }`}
              />
            );
          },
        )}
      </div>

      {/* STEP 1: Initial scan to identify trailer */}
      {step === "scan" && (
        <ScanToIdentify
          trailers={trailers ?? []}
          onIdentified={(id) => {
            setTrailerId(id);
            setStep("photo");
          }}
        />
      )}

      {/* STEP 2: Photo + Comments */}
      {step === "photo" && (
        <div className="space-y-4">
          {trailer && (
            <div className="bg-white rounded-xl shadow-card px-5 py-3 flex items-center gap-2">
              <span className="font-bold">{trailer.code}</span>
              <span className="text-muted-foreground text-sm">
                {trailer.name}
              </span>
            </div>
          )}
          <PhotoCapture
            title="Fotografera kärran"
            maxPhotos={5}
            skipLabel="Hoppa över foton"
            onPhotosConfirmed={handlePhotosConfirmed}
            onSkip={handlePhotoSkip}
          />
          <div className="bg-white rounded-xl shadow-card p-5">
            <label
              htmlFor="besiktning-comments"
              className="block text-sm font-semibold mb-2"
            >
              Kommentarer om kärran
            </label>
            <Textarea
              id="besiktning-comments"
              data-ocid="besiktning.comments.textarea"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Kommentarer om kärran..."
              className="min-h-24 text-base"
            />
          </div>
          <Button
            data-ocid="besiktning.photo.continue.button"
            onClick={() => setStep("save")}
            className="w-full h-12"
          >
            Fortsätt utan foto
          </Button>
        </div>
      )}

      {/* STEP 3: Summary + start */}
      {step === "save" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-card p-5 space-y-3">
            <h2 className="font-semibold text-lg">Sammanfattning</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trailer</span>
                <span className="font-semibold">{trailer?.code ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Foton</span>
                <span className="font-semibold">{photos.length} st</span>
              </div>
              {comments && (
                <div>
                  <span className="text-muted-foreground">Kommentar</span>
                  <p className="mt-1 text-xs bg-muted rounded-lg p-2 line-clamp-3">
                    {comments}
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button
            data-ocid="besiktning.start.primary_button"
            onClick={handleStartInspection}
            disabled={uploading || isStarting}
            className="w-full h-14 text-base font-bold gap-2"
          >
            {uploading || isStarting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ClipboardCheck className="w-5 h-5" />
            )}
            Starta besiktning
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep("photo")}
            className="w-full h-11"
          >
            Tillbaka
          </Button>
        </div>
      )}

      {/* STEP 4: Final QR scan to close */}
      {step === "final-scan" && trailerCode && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <QrCode className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                Skanna QR-koden för att avsluta
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Skanna QR-koden på kärran för att avsluta besiktningen.
              </p>
            </div>
          </div>
          <TrailerScanStep
            trailerCode={trailerCode}
            actionLabel="avslutning av besiktning"
            onConfirmed={handleFinalScan}
          />
          {isClosing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Avslutar besiktning...
            </div>
          )}
        </div>
      )}

      {/* STEP 5: Done */}
      {step === "done" && (
        <div className="bg-white rounded-xl shadow-card p-10 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <h2 className="text-2xl font-bold">Besiktning klar!</h2>
          <p className="text-muted-foreground">
            Besiktningen för {trailer?.code} är nu avslutad och sparad.
          </p>
          <Button
            data-ocid="besiktning.done.primary_button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full h-12 mt-2"
          >
            Tillbaka till dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

// Sub-component: scan to identify which trailer
function ScanToIdentify({
  trailers,
  onIdentified,
}: {
  trailers: import("../hooks/useQueries").Trailer[];
  onIdentified: (id: bigint) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const handleCode = (code: string) => {
    const found = trailers.find(
      (t) => t.code.trim().toLowerCase() === code.trim().toLowerCase(),
    );
    if (found) {
      setError(null);
      onIdentified(found.id);
    } else {
      setError(
        `Ingen trailer hittades med koden "${code}". Kontrollera koden och försök igen.`,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="text-xl font-bold mb-1">Välj trailer</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Välj en trailer i listan eller ange koden manuellt.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {trailers.map((t) => (
            <button
              key={t.id.toString()}
              type="button"
              data-ocid="besiktning.trailer.select.button"
              className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
              onClick={() => onIdentified(t.id)}
            >
              <span className="font-bold">{t.code}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold mb-3">Ange kod manuellt</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCode(manualInput.trim());
          }}
          className="flex gap-2"
        >
          <input
            data-ocid="besiktning.manual.input"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="T.ex. T-001"
            className="flex-1 h-12 px-3 rounded-lg border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="submit"
            disabled={!manualInput.trim()}
            className="h-12 px-4"
          >
            OK
          </Button>
        </form>
        {error && (
          <p
            data-ocid="besiktning.trailer.error_state"
            className="text-destructive text-sm mt-2"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
