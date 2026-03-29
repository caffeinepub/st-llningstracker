import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  Copy,
  History,
  Loader2,
  Package,
  Plus,
  Settings,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Variant_created_loadoutSet_statusChanged_checkedOut_returned } from "../backend";
import { TrailerStatus } from "../backend";
import { loadConfig } from "../config";
import {
  useAllActivityLogs,
  useAllPhotos,
  useCreatePartType,
  useCreateTrailer,
  useGetAllInspections,
  useListPartTypes,
  useListTrailers,
  useLoadout,
  useSetLoadout,
  useUpdateTrailer,
} from "../hooks/useQueries";
import type { ActivityLogEntry, Trailer } from "../hooks/useQueries";

// --- Photo URL hook ---
function usePhotoUrl(hash: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadConfig().then((config) => {
      if (!cancelled && hash) {
        setUrl(
          `${config.storage_gateway_url}/v1/blob/?blob_hash=${encodeURIComponent(hash)}&owner_id=${encodeURIComponent(config.backend_canister_id)}&project_id=${encodeURIComponent(config.project_id)}`,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hash]);
  return url;
}

// --- PhotoThumb: single thumbnail ---
function PhotoThumb({ hash, onClick }: { hash: string; onClick: () => void }) {
  const url = usePhotoUrl(hash);
  if (!url)
    return <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0 hover:opacity-80 transition-opacity"
    >
      <img src={url} alt="Foto" className="w-full h-full object-cover" />
    </button>
  );
}

// --- PhotoLightbox ---
function PhotoLightbox({
  hash,
  onClose,
}: { hash: string; onClose: () => void }) {
  const url = usePhotoUrl(hash);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      data-ocid="history.photo.modal"
      className="fixed inset-0 z-50 bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full flex items-center justify-center backdrop:bg-black/80"
      onClose={onClose}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-10"
        data-ocid="history.photo.close_button"
      >
        <X className="w-7 h-7" />
      </button>
      {url ? (
        <img
          src={url}
          alt="Foto stor"
          className="max-h-[85vh] max-w-full rounded-xl object-contain"
        />
      ) : (
        <div className="w-16 h-16 bg-muted rounded-xl animate-pulse" />
      )}
    </dialog>
  );
}

// --- PhotoGrid: renders clickable thumbnails ---
function PhotoGrid({ hashes }: { hashes: string[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!hashes || hashes.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {hashes.map((h) => (
          <PhotoThumb key={h} hash={h} onClick={() => setOpen(h)} />
        ))}
      </div>
      {open && <PhotoLightbox hash={open} onClose={() => setOpen(null)} />}
    </>
  );
}

// --- Action label ---
function actionLabel(
  action: Variant_created_loadoutSet_statusChanged_checkedOut_returned,
): string {
  switch (action) {
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.checkedOut:
      return "Utcheckad";
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.returned:
      return "Inlämnad";
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.created:
      return "Skapad";
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.loadoutSet:
      return "Lastlista uppdaterad";
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.statusChanged:
      return "Status ändrad";
    default:
      return "Okänd";
  }
}

function actionColor(
  action: Variant_created_loadoutSet_statusChanged_checkedOut_returned,
): string {
  switch (action) {
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.checkedOut:
      return "bg-orange-100 text-orange-700";
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.returned:
      return "bg-green-100 text-green-700";
    case Variant_created_loadoutSet_statusChanged_checkedOut_returned.created:
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusLabel(status: TrailerStatus): string {
  switch (status) {
    case TrailerStatus.available:
      return "Tillgänglig";
    case TrailerStatus.out:
      return "Ute";
    case TrailerStatus.returned:
      return "Återlämnad";
    case TrailerStatus.incomplete:
      return "Ofullständig";
  }
}

// --- TrailerHistoryRow: receives photos as prop, no hooks for photos ---
function TrailerHistoryRow({
  entry,
  trailers,
  idx,
  photoHashes,
}: {
  entry: ActivityLogEntry;
  trailers: Trailer[];
  idx: number;
  photoHashes: string[];
}) {
  const trailer = trailers.find((t) => t.id === entry.trailerId);

  const dateStr = new Date(Number(entry.timestamp / 1_000_000n)).toLocaleString(
    "sv-SE",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  );

  return (
    <div
      data-ocid={`history.item.${idx}`}
      className="border border-border rounded-xl p-3 bg-white"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">
              {trailer
                ? trailer.code
                : `Trailer #${entry.trailerId.toString()}`}
            </span>
            {trailer && (
              <span className="text-xs text-muted-foreground truncate">
                {trailer.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColor(entry.action)}`}
            >
              {actionLabel(entry.action)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dateStr}
            </span>
          </div>
          {entry.details && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {entry.details}
            </p>
          )}
        </div>
      </div>
      {photoHashes.length > 0 && <PhotoGrid hashes={photoHashes} />}
    </div>
  );
}

// --- HistorySection ---
function HistorySection({ trailers }: { trailers: Trailer[] }) {
  const { data: logs, isLoading } = useAllActivityLogs();

  const uniqueTrailerIds = useMemo(() => {
    if (!logs) return [];
    const seen = new Set<string>();
    const ids: bigint[] = [];
    for (const entry of logs) {
      const key = entry.trailerId.toString();
      if (!seen.has(key)) {
        seen.add(key);
        ids.push(entry.trailerId);
      }
    }
    return ids;
  }, [logs]);

  const { data: allPhotos } = useAllPhotos(uniqueTrailerIds);

  const photosByLogIndex = useMemo(() => {
    if (!logs || !allPhotos) return {};
    const assignedCheckout = new Set<string>();
    const assignedReturn = new Set<string>();
    const result: Record<number, string[]> = {};
    const isCheckout =
      Variant_created_loadoutSet_statusChanged_checkedOut_returned.checkedOut;
    const isReturn =
      Variant_created_loadoutSet_statusChanged_checkedOut_returned.returned;

    logs.forEach((entry, i) => {
      const tid = entry.trailerId.toString();
      if (entry.action === isCheckout && !assignedCheckout.has(tid)) {
        const photos = allPhotos.checkoutPhotos[tid] ?? [];
        if (photos.length > 0) {
          result[i] = photos;
          assignedCheckout.add(tid);
        }
      } else if (entry.action === isReturn && !assignedReturn.has(tid)) {
        const photos = allPhotos.returnPhotos[tid] ?? [];
        if (photos.length > 0) {
          result[i] = photos;
          assignedReturn.add(tid);
        }
      }
    });
    return result;
  }, [logs, allPhotos]);

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <History className="w-5 h-5" />
        Historik &amp; Bilder
      </h2>
      {isLoading ? (
        <div className="space-y-3" data-ocid="history.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((entry, i) => (
            <TrailerHistoryRow
              key={`${entry.trailerId.toString()}-${entry.timestamp.toString()}-${i}`}
              entry={entry}
              trailers={trailers}
              idx={i + 1}
              photoHashes={photosByLogIndex[i] ?? []}
            />
          ))}
        </div>
      ) : (
        <p
          data-ocid="history.empty_state"
          className="text-sm text-muted-foreground"
        >
          Ingen historik ännu
        </p>
      )}
    </div>
  );
}

// --- InspectionsSection ---
function InspectionsSection({ trailers }: { trailers: Trailer[] }) {
  const { data: inspections, isLoading } = useGetAllInspections();

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-5 h-5" />
        Besiktningar
      </h2>
      {isLoading ? (
        <div className="space-y-3" data-ocid="inspections.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : inspections && inspections.length > 0 ? (
        <div className="space-y-3">
          {(inspections as any[]).map((insp, i) => {
            const trailer = trailers.find((t) => t.id === insp.trailerId);
            const dateStr = new Date(
              Number(insp.startTime / 1_000_000n),
            ).toLocaleString("sv-SE", {
              dateStyle: "short",
              timeStyle: "short",
            });
            const isClosed =
              insp.status === "closed" ||
              (typeof insp.status === "object" && "closed" in insp.status);
            return (
              <div
                key={insp.id?.toString() ?? i}
                data-ocid={`inspections.item.${i + 1}`}
                className="border border-border rounded-xl p-3 bg-white"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        {trailer?.code ??
                          `Trailer #${insp.trailerId?.toString()}`}
                      </span>
                      {trailer && (
                        <span className="text-xs text-muted-foreground">
                          {trailer.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isClosed
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isClosed ? "Avslutad" : "Pågående"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(insp.photoHashes as string[])?.length ?? 0} foton
                      </span>
                    </div>
                    {insp.comments && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {insp.comments}
                      </p>
                    )}
                  </div>
                </div>
                {(insp.photoHashes as string[])?.length > 0 && (
                  <PhotoGrid hashes={insp.photoHashes as string[]} />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p
          data-ocid="inspections.empty_state"
          className="text-sm text-muted-foreground"
        >
          Inga besiktningar gjorda ännu
        </p>
      )}
    </div>
  );
}

// --- CopyLoadoutButton ---
function CopyLoadoutButton({
  trailer,
  trailers,
}: { trailer: Trailer; trailers: Trailer[] }) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>("");
  const { data: sourceLoadout } = useLoadout(trailer.id);
  const { mutateAsync: setLoadout, isPending } = useSetLoadout();

  const otherTrailers = trailers.filter((t) => t.id !== trailer.id);

  const handleCopy = async () => {
    if (!targetId || !sourceLoadout) return;
    try {
      await setLoadout({
        trailerId: BigInt(targetId),
        items: sourceLoadout,
      });
      toast.success("Lastlista kopierad!");
      setOpen(false);
      setTargetId("");
    } catch {
      toast.error("Kunde inte kopiera lastlista.");
    }
  };

  if (!open) {
    return (
      <Button
        data-ocid="admin.loadout.copy.button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={() => {
          if (!sourceLoadout || sourceLoadout.length === 0) {
            toast.info("Denna trailer har ingen lastlista att kopiera.");
            return;
          }
          setOpen(true);
        }}
      >
        <Copy className="w-3 h-3" />
        Kopiera lastlista
      </Button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
      <select
        data-ocid="admin.loadout.copy.select"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="flex-1 h-8 text-xs border border-border rounded-md px-2 bg-background"
      >
        <option value="">Välj måltrailer...</option>
        {otherTrailers.map((t) => (
          <option key={t.id.toString()} value={t.id.toString()}>
            {t.code} — {t.name}
          </option>
        ))}
      </select>
      <Button
        data-ocid="admin.loadout.copy.confirm_button"
        size="sm"
        disabled={!targetId || isPending}
        onClick={handleCopy}
        className="h-8 text-xs"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Kopiera"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={() => {
          setOpen(false);
          setTargetId("");
        }}
      >
        Avbryt
      </Button>
    </div>
  );
}

// --- Existing form components ---

function CreateTrailerForm() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { mutateAsync, isPending } = useCreateTrailer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    try {
      await mutateAsync({
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
      });
      setCode("");
      setName("");
      setDescription("");
      toast.success("Trailer skapad!");
    } catch {
      toast.error("Kunde inte skapa trailer.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="t-code">Trailer-kod</Label>
        <Input
          data-ocid="admin.trailer.code.input"
          id="t-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="T.ex. T-001"
          className="mt-1 h-12"
          required
        />
      </div>
      <div>
        <Label htmlFor="t-name">Namn</Label>
        <Input
          data-ocid="admin.trailer.name.input"
          id="t-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. Ställningstrailer 01"
          className="mt-1 h-12"
          required
        />
      </div>
      <div>
        <Label htmlFor="t-desc">Beskrivning (valfritt)</Label>
        <Input
          data-ocid="admin.trailer.description.input"
          id="t-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="T.ex. Liten trailer, 2-axlad"
          className="mt-1 h-12"
        />
      </div>
      <Button
        data-ocid="admin.trailer.submit_button"
        type="submit"
        disabled={isPending || !code.trim() || !name.trim()}
        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Skapa trailer
      </Button>
    </form>
  );
}

function CreatePartTypeForm() {
  const [name, setName] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const { mutateAsync, isPending } = useCreatePartType();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unitLabel.trim()) return;
    try {
      await mutateAsync({ name: name.trim(), unitLabel: unitLabel.trim() });
      setName("");
      setUnitLabel("");
      toast.success("Deltyp skapad!");
    } catch {
      toast.error("Kunde inte skapa deltyp.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="pt-name">Namn på deltyp</Label>
        <Input
          data-ocid="admin.parttype.name.input"
          id="pt-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T.ex. Ram, Plank, Diagonalstag"
          className="mt-1 h-12"
          required
        />
      </div>
      <div>
        <Label htmlFor="pt-unit">Enhet</Label>
        <Input
          data-ocid="admin.parttype.unit.input"
          id="pt-unit"
          value={unitLabel}
          onChange={(e) => setUnitLabel(e.target.value)}
          placeholder="T.ex. st, par"
          className="mt-1 h-12"
          required
        />
      </div>
      <Button
        data-ocid="admin.parttype.submit_button"
        type="submit"
        disabled={isPending || !name.trim() || !unitLabel.trim()}
        className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Skapa deltyp
      </Button>
    </form>
  );
}

function LoadoutEditor({
  trailerId,
  trailerCode,
}: { trailerId: bigint; trailerCode: string }) {
  const { data: partTypes } = useListPartTypes();
  const { data: currentLoadout } = useLoadout(trailerId);
  const { mutateAsync: setLoadout, isPending } = useSetLoadout();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const getQty = (ptId: bigint) => {
    const key = ptId.toString();
    if (quantities[key] !== undefined) return quantities[key];
    const existing = currentLoadout?.find((i) => i.partTypeId === ptId);
    return existing ? existing.quantity.toString() : "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = (partTypes ?? []).flatMap((pt) => {
      const qty = Number.parseInt(getQty(pt.id), 10);
      if (!qty || qty <= 0) return [];
      return [{ partTypeId: pt.id, quantity: BigInt(qty) }];
    });
    try {
      await setLoadout({ trailerId, items });
      toast.success("Lastlista sparad!");
      setOpen(false);
    } catch {
      toast.error("Kunde inte spara lastlista.");
    }
  };

  if (!open) {
    return (
      <Button
        data-ocid="admin.loadout.edit.button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setOpen(true)}
      >
        Redigera lastlista
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="mt-2 space-y-2 border-t border-border pt-3"
    >
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        Lastlista för {trailerCode}
      </p>
      {(partTypes ?? []).map((pt, i) => (
        <div key={pt.id.toString()} className="flex items-center gap-2">
          <span className="flex-1 text-sm">{pt.name}</span>
          <Input
            data-ocid={`admin.loadout.qty.input.${i + 1}`}
            type="number"
            min="0"
            value={getQty(pt.id)}
            onChange={(e) =>
              setQuantities((prev) => ({
                ...prev,
                [pt.id.toString()]: e.target.value,
              }))
            }
            placeholder="0"
            className="w-20 h-8 text-center text-sm"
          />
          <span className="text-xs text-muted-foreground w-6">
            {pt.unitLabel}
          </span>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button
          data-ocid="admin.loadout.save.button"
          type="submit"
          size="sm"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Spara
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Avbryt
        </Button>
      </div>
    </form>
  );
}

function SetAvailableButton({ trailer }: { trailer: Trailer }) {
  const { mutateAsync, isPending } = useUpdateTrailer();

  if (trailer.status === TrailerStatus.available) return null;

  const handleClick = async () => {
    try {
      await mutateAsync({
        id: trailer.id,
        name: trailer.name,
        description: trailer.description,
        status: TrailerStatus.available,
      });
      toast.success(`${trailer.code} är nu tillgänglig`);
    } catch {
      toast.error("Kunde inte uppdatera status.");
    }
  };

  return (
    <Button
      data-ocid="admin.trailer.set_available.button"
      variant="outline"
      size="sm"
      className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50 gap-1"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <CheckCircle className="w-3 h-3" />
      )}
      Sätt tillgänglig
    </Button>
  );
}

export default function AdminPage() {
  const { data: partTypes, isLoading: ptLoading } = useListPartTypes();
  const { data: trailers, isLoading: trailersLoading } = useListTrailers();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Admin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hantera trailers och deltyper
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5" />
          Skapa ny trailer
        </h2>
        <CreateTrailerForm />
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5" />
          Trailers ({trailers?.length ?? 0})
        </h2>
        {trailersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : trailers && trailers.length > 0 ? (
          <div className="space-y-3">
            {trailers.map((t, i) => (
              <div
                key={t.code}
                data-ocid={`admin.trailers.item.${i + 1}`}
                className="border border-border rounded-lg p-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-bold">{t.code}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {t.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({statusLabel(t.status)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SetAvailableButton trailer={t} />
                    <Link to="/trailer/$id" params={{ id: t.id.toString() }}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        Visa
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <LoadoutEditor trailerId={t.id} trailerCode={t.code} />
                  <CopyLoadoutButton trailer={t} trailers={trailers} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            data-ocid="admin.trailers.empty_state"
            className="text-sm text-muted-foreground"
          >
            Inga trailers skapade ännu
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Package className="w-5 h-5" />
          Skapa deltyp
        </h2>
        <CreatePartTypeForm />
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Package className="w-5 h-5" />
          Deltyper ({partTypes?.length ?? 0})
        </h2>
        {ptLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : partTypes && partTypes.length > 0 ? (
          <div className="space-y-2">
            {partTypes.map((pt, i) => (
              <div
                key={pt.name}
                data-ocid={`admin.parttypes.item.${i + 1}`}
                className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg"
              >
                <span className="font-medium text-sm">{pt.name}</span>
                <span className="text-xs text-muted-foreground">
                  {pt.unitLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            data-ocid="admin.parttypes.empty_state"
            className="text-sm text-muted-foreground"
          >
            Inga deltyper skapade
          </p>
        )}
      </div>

      <InspectionsSection trailers={trailers ?? []} />
      <HistorySection trailers={trailers ?? []} />
    </div>
  );
}
