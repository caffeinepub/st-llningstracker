import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Package,
  Printer,
} from "lucide-react";
import {
  TrailerStatus,
  type Variant_created_loadoutSet_statusChanged_checkedOut_returned,
} from "../backend";
import CodeDisplay from "../components/CodeDisplay";
import StatusBadge from "../components/StatusBadge";
import {
  useListPartTypes,
  useLoadout,
  useTrailer,
  useTrailerLog,
} from "../hooks/useQueries";

const ACTION_LABELS: Record<
  Variant_created_loadoutSet_statusChanged_checkedOut_returned,
  string
> = {
  created: "Skapad",
  loadoutSet: "Utrustning uppdaterad",
  statusChanged: "Status ändrad",
  checkedOut: "Utcheckad",
  returned: "Inlämnad",
};

export default function TrailerDetail() {
  const { id } = useParams({ from: "/trailer/$id" });
  const trailerId = BigInt(id);

  const { data: trailer, isLoading: trailerLoading } = useTrailer(trailerId);
  const { data: loadout, isLoading: loadoutLoading } = useLoadout(trailerId);
  const { data: log, isLoading: logLoading } = useTrailerLog(trailerId);
  const { data: partTypes } = useListPartTypes();

  const getPartTypeName = (ptId: bigint) => {
    const pt = partTypes?.find((p) => p.id === ptId);
    return pt ? `${pt.name} (${pt.unitLabel})` : `Deltyp #${ptId}`;
  };

  if (trailerLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!trailer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Trailer hittades inte</p>
        <Link to="/">
          <Button className="mt-4">Tillbaka till dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </Link>

      <div className="bg-white rounded-xl shadow-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{trailer.code}</h1>
            <p className="text-lg font-medium text-foreground mt-1">
              {trailer.name}
            </p>
            {trailer.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {trailer.description}
              </p>
            )}
          </div>
          <StatusBadge status={trailer.status} />
        </div>

        <div className="flex flex-col items-center gap-3 py-4 border-t border-border">
          <CodeDisplay value={trailer.code} size={160} />
          <p className="text-xs text-muted-foreground font-mono">
            {trailer.code}
          </p>
          <Link to="/trailer/$id/print" params={{ id }}>
            <Button
              data-ocid="trailer.print.button"
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Skriv ut QR-etikett
            </Button>
          </Link>
        </div>

        <div className="flex gap-3 pt-2">
          {trailer.status === TrailerStatus.available && (
            <Link to="/trailer/$id/checkout" params={{ id }} className="flex-1">
              <Button
                data-ocid="trailer.checkout.primary_button"
                className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                Checka ut trailer
              </Button>
            </Link>
          )}
          {(trailer.status === TrailerStatus.out ||
            trailer.status === TrailerStatus.incomplete) && (
            <Link to="/trailer/$id/return" params={{ id }} className="flex-1">
              <Button
                data-ocid="trailer.return.primary_button"
                className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
              >
                <ArrowDownLeft className="w-5 h-5" />
                Lämna in trailer
              </Button>
            </Link>
          )}
          {trailer.status === TrailerStatus.returned && (
            <Link to="/trailer/$id/checkout" params={{ id }} className="flex-1">
              <Button
                data-ocid="trailer.recheckout.primary_button"
                className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                Checka ut trailer
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-muted-foreground" />
          Lastlista
        </h2>
        {loadoutLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : loadout && loadout.length > 0 ? (
          <div className="space-y-2">
            {loadout.map((item, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list
                key={i}
                data-ocid={`loadout.item.${i + 1}`}
                className="flex items-center justify-between py-2.5 px-3 bg-muted rounded-lg"
              >
                <span className="text-sm font-medium">
                  {getPartTypeName(item.partTypeId)}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {item.quantity.toString()} st
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            data-ocid="loadout.empty_state"
            className="text-sm text-muted-foreground py-2"
          >
            Ingen lastlista registrerad
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-semibold text-lg mb-3">Historik</h2>
        {logLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : log && log.length > 0 ? (
          <div className="space-y-2">
            {log.map((entry, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered log
                key={i}
                data-ocid={`log.item.${i + 1}`}
                className="flex items-start gap-3 py-2.5 border-b last:border-0 border-border"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACTION_LABELS[entry.action]}
                  </p>
                  {entry.details && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.details}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(
                    Number(entry.timestamp / 1_000_000n),
                  ).toLocaleDateString("sv-SE")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            data-ocid="log.empty_state"
            className="text-sm text-muted-foreground"
          >
            Ingen historik
          </p>
        )}
      </div>
    </div>
  );
}
