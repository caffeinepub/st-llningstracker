import { Button } from "@/components/ui/button";
import { useParams } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import CodeDisplay from "../components/CodeDisplay";
import { useTrailer } from "../hooks/useQueries";

export default function PrintPage() {
  const { id } = useParams({ from: "/trailer/$id/print" });
  const trailerId = BigInt(id);
  const { data: trailer, isLoading } = useTrailer(trailerId);

  if (isLoading) {
    return <div className="p-8">Laddar...</div>;
  }

  if (!trailer) {
    return <div className="p-8">Trailer hittades inte</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Print button — hidden during actual print */}
      <div className="no-print mb-8">
        <Button
          data-ocid="print.print.button"
          onClick={() => window.print()}
          className="bg-foreground text-background hover:bg-foreground/90 gap-2"
        >
          <Printer className="w-4 h-4" />
          Skriv ut
        </Button>
      </div>

      {/* Print content */}
      <div className="flex flex-col items-center gap-6 print:mt-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Ställningstracker</h1>
          <p className="text-muted-foreground mt-1">
            Ställningstrailer QR-etikett
          </p>
        </div>

        <div className="border-4 border-foreground p-8 rounded-2xl">
          <CodeDisplay value={trailer.code} size={320} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-5xl font-black tracking-wider">{trailer.code}</p>
          <p className="text-xl font-semibold text-muted-foreground">
            {trailer.name}
          </p>
          {trailer.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {trailer.description}
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-4 text-center">
          <p>Skanna QR-koden med mobiltelefonen</p>
          <p>för att se trailer-information</p>
        </div>
      </div>
    </div>
  );
}
