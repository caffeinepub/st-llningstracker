import { useState } from "react";
import BarcodeDisplay from "./BarcodeDisplay";
import QRCodeDisplay from "./QRCodeDisplay";

interface CodeDisplayProps {
  value: string;
  size?: number;
}

export default function CodeDisplay({ value, size = 180 }: CodeDisplayProps) {
  const [codeType, setCodeType] = useState<"qr" | "barcode">("qr");

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Toggle */}
      <div className="flex rounded-full bg-muted p-1 gap-1">
        <button
          type="button"
          data-ocid="codedisplay.qr.toggle"
          onClick={() => setCodeType("qr")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            codeType === "qr"
              ? "bg-white text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          QR-kod
        </button>
        <button
          type="button"
          data-ocid="codedisplay.barcode.toggle"
          onClick={() => setCodeType("barcode")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            codeType === "barcode"
              ? "bg-white text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Streckkod
        </button>
      </div>

      {/* Code */}
      <div className="w-full flex justify-center">
        {codeType === "qr" ? (
          <QRCodeDisplay value={value} size={size} />
        ) : (
          <div className="w-full max-w-xs">
            <BarcodeDisplay value={value} height={80} />
          </div>
        )}
      </div>
    </div>
  );
}
