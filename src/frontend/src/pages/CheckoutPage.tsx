import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CheckCircle, Package } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import PhotoCapture from "../components/PhotoCapture";
import TrailerScanStep from "../components/TrailerScanStep";
import {
  useCheckoutTrailer,
  useListPartTypes,
  useLoadout,
  useTrailer,
} from "../hooks/useQueries";
import { uploadPhotos } from "../utils/uploadPhotos";

type Step = "scan" | "photo" | "confirm";

export default function CheckoutPage() {
  const { id } = useParams({ from: "/trailer/$id/checkout" });
  const trailerId = BigInt(id);
  const navigate = useNavigate();

  const { data: trailer, isLoading } = useTrailer(trailerId);
  const { data: loadout } = useLoadout(trailerId);
  const { data: partTypes } = useListPartTypes();
  const { mutateAsync: checkout, isPending } = useCheckoutTrailer();

  const [step, setStep] = useState<Step>("scan");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const getPartTypeName = (ptId: bigint) => {
    const pt = partTypes?.find((p) => p.id === ptId);
    return pt?.name ?? `Deltyp #${ptId}`;
  };

  const handleCheckout = async () => {
    try {
      let hashes: string[] = [];
      if (photos.length > 0) {
        setUploading(true);
        toast.loading("Laddar upp bilder...", { id: "photo-upload" });
        try {
          hashes = await uploadPhotos(photos);
          toast.dismiss("photo-upload");
        } catch {
          toast.dismiss("photo-upload");
          toast.error("Kunde inte ladda upp bilder. Försöker ändå checka ut.");
        } finally {
          setUploading(false);
        }
      }
      await checkout({ trailerId, photoHashes: hashes });
      setDone(true);
      setTimeout(() => navigate({ to: "/trailer/$id", params: { id } }), 2500);
    } catch {
      toast.error("Utcheckning misslyckades. Försök igen.");
    }
  };

  const handlePhotosConfirmed = (capturedPhotos: File[]) => {
    setPhotos(capturedPhotos);
    setStep("confirm");
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
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
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-card p-10 flex flex-col items-center gap-4 text-center"
            data-ocid="checkout.success_state"
          >
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold">Utcheckad!</h2>
            <p className="text-muted-foreground">
              Trailern är nu markerad som ute.
            </p>
            <p className="text-sm text-muted-foreground">
              Omdirigerar dig snart...
            </p>
          </motion.div>
        ) : step === "scan" && trailer ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TrailerScanStep
              trailerCode={trailer.code}
              actionLabel="utcheckning"
              onConfirmed={() => setStep("photo")}
            />
          </motion.div>
        ) : step === "photo" ? (
          <motion.div
            key="photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <PhotoCapture
              title="Fotografera trailern (valfritt)"
              onPhotosConfirmed={handlePhotosConfirmed}
              onSkip={() => setStep("confirm")}
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
                <h1 className="text-2xl font-bold">Checka ut trailer</h1>
                <p className="text-lg font-semibold text-muted-foreground mt-1">
                  {trailer?.code} — {trailer?.name}
                </p>
              </div>

              {photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">
                    📷 {photos.length} foto{photos.length !== 1 ? "n" : ""}{" "}
                    tagna
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

              {loadout && loadout.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Lastlista ({loadout.length} poster)
                  </h3>
                  <div className="space-y-2">
                    {loadout.map((item, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list
                        key={i}
                        className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg text-sm"
                      >
                        <span>{getPartTypeName(item.partTypeId)}</span>
                        <span className="font-bold">
                          {item.quantity.toString()} st
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Trailern markeras som <strong>Ute</strong> och en loggpost
                  skapas.
                </p>
                <Button
                  data-ocid="checkout.confirm.primary_button"
                  onClick={handleCheckout}
                  disabled={isPending || uploading}
                  className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  {isPending || uploading
                    ? "Behandlar..."
                    : "Bekräfta utlämning"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
