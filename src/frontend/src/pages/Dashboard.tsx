import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  ScanLine,
  Truck,
} from "lucide-react";
import { TrailerStatus } from "../backend";
import StatusBadge from "../components/StatusBadge";
import { useDashboardStats, useListTrailers } from "../hooks/useQueries";

function KPICard({
  label,
  value,
  color,
}: { label: string; value: bigint | number; color: string }) {
  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-card flex flex-col gap-1 border-t-4 ${color}`}
    >
      <span className="text-2xl font-bold text-foreground">
        {value.toString()}
      </span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: trailers, isLoading: trailersLoading } = useListTrailers();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const total = trailers?.length ?? 0;

  const canCheckout = (status: TrailerStatus) =>
    status === TrailerStatus.available ||
    status === TrailerStatus.returned ||
    status === TrailerStatus.incomplete;

  const canReturn = (status: TrailerStatus) =>
    status === TrailerStatus.out || status === TrailerStatus.incomplete;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Översikt över alla ställningstrailers
          </p>
        </div>
        <Link to="/scan">
          <Button
            data-ocid="dashboard.scan.primary_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-semibold"
          >
            <ScanLine className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Skanna</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        ) : (
          <>
            <KPICard label="Totalt" value={total} color="border-gray-300" />
            <KPICard
              label="Tillgängliga"
              value={stats?.available ?? 0n}
              color="border-green-400"
            />
            <KPICard
              label="Ute"
              value={stats?.out ?? 0n}
              color="border-red-400"
            />
            <KPICard
              label="Inlämnade"
              value={stats?.returned ?? 0n}
              color="border-blue-400"
            />
          </>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Alla Trailers</h2>
        {trailersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : trailers && trailers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trailers.map((trailer, idx) => (
              <div
                key={trailer.id.toString()}
                data-ocid={`trailers.item.${idx + 1}`}
                className="bg-white rounded-xl shadow-card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xl font-bold text-foreground">
                      {trailer.code}
                    </span>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {trailer.name}
                    </p>
                  </div>
                  <StatusBadge status={trailer.status} />
                </div>
                {trailer.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {trailer.description}
                  </p>
                )}
                <div className="flex gap-2 mt-auto pt-1">
                  <Link
                    to="/trailer/$id"
                    params={{ id: trailer.id.toString() }}
                    className="flex-1"
                  >
                    <Button
                      data-ocid={`trailers.view.button.${idx + 1}`}
                      variant="outline"
                      className="w-full h-11 text-sm"
                    >
                      <Truck className="w-4 h-4 mr-1.5" />
                      Detaljer
                    </Button>
                  </Link>
                  {canCheckout(trailer.status) && (
                    <Link
                      to="/trailer/$id/checkout"
                      params={{ id: trailer.id.toString() }}
                      className="flex-1"
                    >
                      <Button
                        data-ocid={`trailers.checkout.button.${idx + 1}`}
                        className="w-full h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        Checka ut
                      </Button>
                    </Link>
                  )}
                  {canReturn(trailer.status) && (
                    <Link
                      to="/trailer/$id/return"
                      params={{ id: trailer.id.toString() }}
                      className="flex-1"
                    >
                      <Button
                        data-ocid={`trailers.return.button.${idx + 1}`}
                        className="w-full h-11 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      >
                        <ArrowDownLeft className="w-4 h-4 mr-1" />
                        Lämna in
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            data-ocid="trailers.empty_state"
            className="bg-white rounded-xl shadow-card p-12 text-center"
          >
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">
              Inga trailers hittades
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Gå till Admin för att skapa trailers
            </p>
            <Link to="/admin">
              <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                Gå till Admin
              </Button>
            </Link>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
