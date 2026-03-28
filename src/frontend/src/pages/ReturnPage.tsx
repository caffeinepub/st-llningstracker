import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type ReturnItem, Variant_ok_missing_extra } from "../backend";
import PhotoCapture from "../components/PhotoCapture";
import TrailerScanStep from "../components/TrailerScanStep";
import {
  useListPartTypes,
  useLoadout,
  useReturnTrailer,
  useTrailer,
} from "../hooks/useQueries";
import { uploadPhotos } from "../utils/uploadPhotos";

function getDiscrepancy(
  expected: number,
  actual: number,
): Variant_ok_missing_extra {
  if (actual === expected) return Variant_ok_missing_extra.ok;
  if (actual < expected) return Variant_ok_missing_extra.missing;
  return Variant_ok_missing_extra.extra;
}

const DISC_ICONS: Record<Variant_ok_missing_extra, string> = {
  ok: "✅",
  missing: "❌",
  extra: "➕",
};

const DISC_LABELS: Record<Variant_ok_missing_extra, string> = {
  ok: "OK",
  missing: "Saknas",
  extra: "Extra",
};

type Step = "scan" | "counts" | "photo" | "done";

export default function ReturnPage() {
  const { id } = useParams({ from: "/trailer/$id/return" });
  const trailerId = BigInt(id);
  const navigate = useNavigate();

  const { data: trailer, isLoading: trailerLoading } = useTrailer(trailerId);
  const { data: loadout, isLoading: loadoutLoading } = useLoadout(trailerId);
  const { data: partTypes } = useListPartTypes();
  const { mutateAsync: returnTrailer, isPending } = useReturnTrailer();

  const [step, setStep] = useState<Step>("scan");
  const [actualCounts, setActualCounts] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [result, setResult] = useState<ReturnItem[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const getPartTypeName = (ptId: bigint) => {
    const pt = partTypes?.find((p) => p.id === ptId);
    return pt?.name ?? `Deltyp #${ptId}`;
  };

  const getActual = (ptId: bigint): number => {
    const val = actualCounts[ptId.toString()];
    return val ? Number.parseInt(val, 10) || 0 : 0;
  };

  const handleReturn = async (capturedPhotos: File[]) => {
    if (!loadout) return;
    const items: ReturnItem[] = loadout.map((item) => {
      const expected = Number(item.quantity);
      const actual = getActual(item.partTypeId);
      return {
        partTypeId: item.partTypeId,
        expectedCount: BigInt(expected),
        actualCount: BigInt(actual),
        discrepancy: getDiscrepancy(expected, actual),
      };
    });
    try {
      let hashes: string[] = [];
      if (capturedPhotos.length > 0) {
        setUploading(true);
        toast.loading("Laddar upp bilder...", { id: "photo-upload" });
        try {
          hashes = await uploadPhotos(capturedPhotos);
          toast.dismiss("photo-upload");
        } catch {
          toast.dismiss("photo-upload");
          toast.error("Kunde inte ladda upp bilder. Fortsätter ändå.");
        } finally {
          setUploading(false);
        }
      }
      await returnTrailer({ trailerId, items, photoHashes: hashes });
      setResult(items);
      setStep("done");
    } catch {
      toast.error("Inlämning misslyckades. Försök igen.");
    }
  };

  const handlePhotosConfirmed = (capturedPhotos: File[]) => {
    setPhotos(capturedPhotos);
    handleReturn(capturedPhotos);
  };

  const handleSkipPhoto = () => {
    handleReturn([]);
  };

  const hasDiscrepancies = result?.some(
    (r) => r.discrepancy !== Variant_ok_missing_extra.ok,
  );

  if (trailerLoading || loadoutLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <Link
        to="/trailer/$id"
        params={{ id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </Link>

      <AnimatePresence mode="wait">
        {step === "done" && result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            data-ocid="return.success_state"
          >
            <div className="bg-white rounded-xl shadow-card p-5">
              <div className="flex items-center gap-3 mb-4">
                {hasDiscrepancies ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {hasDiscrepancies ? "Avvikelser hittade" : "Inlämning OK!"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {trailer?.name}
                  </p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    📷 {photos.length} foto{photos.length !== 1 ? "n" : ""}{" "}
                    sparade
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {photos.map((f, i) => {
                      const url = URL.createObjectURL(f);
                      return (
                        <img
                          key={f.name}
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-16 h-12 object-cover rounded-md border border-border"
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {result.map((item, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered result
                    key={i}
                    data-ocid={`return.result.item.${i + 1}`}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm ${
                      item.discrepancy === Variant_ok_missing_extra.ok
                        ? "bg-green-50 border border-green-200"
                        : item.discrepancy === Variant_ok_missing_extra.missing
                          ? "bg-red-50 border border-red-200"
                          : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <span className="font-medium">
                      {getPartTypeName(item.partTypeId)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {item.actualCount.toString()} /{" "}
                        {item.expectedCount.toString()}
                      </span>
                      <span title={DISC_LABELS[item.discrepancy]}>
                        {DISC_ICONS[item.discrepancy]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button
              data-ocid="return.done.button"
              onClick={() => navigate({ to: "/trailer/$id", params: { id } })}
              className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Klar — Gå till trailer
            </Button>
          </motion.div>
        ) : step === "scan" && trailer ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TrailerScanStep
              trailerCode={trailer.code}
              actionLabel="inlämning"
              onConfirmed={() => setStep("counts")}
            />
          </motion.div>
        ) : step === "photo" ? (
          <motion.div
            key="photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <PhotoCapture
              title="Fotografera eventuella avvikelser (valfritt)"
              onPhotosConfirmed={handlePhotosConfirmed}
              onSkip={handleSkipPhoto}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-white rounded-xl shadow-card p-5 space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Lämna in trailer</h1>
                <p className="text-lg font-semibold text-muted-foreground mt-1">
                  {trailer?.code} — {trailer?.name}
                </p>
              </div>

              {loadout && loadout.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-3">Ange faktiskt antal</h3>
                  <div className="space-y-3">
                    {loadout.map((item, i) => {
                      const expected = Number(item.quantity);
                      const actual = getActual(item.partTypeId);
                      const disc = getDiscrepancy(expected, actual);
                      const ptKey = item.partTypeId.toString();
                      return (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered loadout
                          key={i}
                          data-ocid={`return.item.${i + 1}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {getPartTypeName(item.partTypeId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Förväntat: {expected} st
                            </p>
                          </div>
                          <Input
                            data-ocid={`return.count.input.${i + 1}`}
                            type="number"
                            min="0"
                            value={actualCounts[ptKey] ?? ""}
                            onChange={(e) =>
                              setActualCounts((prev) => ({
                                ...prev,
                                [ptKey]: e.target.value,
                              }))
                            }
                            placeholder={expected.toString()}
                            className="w-24 h-11 text-center font-bold"
                          />
                          <span className="text-lg w-6">
                            {DISC_ICONS[disc]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ingen lastlista registrerad
                </p>
              )}

              <div className="border-t border-border pt-4">
                <Button
                  data-ocid="return.confirm.primary_button"
                  onClick={() => setStep("photo")}
                  disabled={isPending || uploading}
                  className="w-full h-14 text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  {isPending || uploading
                    ? "Sparar..."
                    : "Nästa — Foto & bekräfta"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
