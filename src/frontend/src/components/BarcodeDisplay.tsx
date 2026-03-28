import { useEffect, useRef } from "react";

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
}

// Load JsBarcode from CDN once
let jsBarcodePromise: Promise<
  (el: SVGSVGElement, value: string, opts: object) => void
> | null = null;

function loadJsBarcode() {
  if (!jsBarcodePromise) {
    jsBarcodePromise = new Promise((resolve, reject) => {
      if ((window as any).JsBarcode) {
        resolve((window as any).JsBarcode);
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
      script.onload = () => resolve((window as any).JsBarcode);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return jsBarcodePromise;
}

export default function BarcodeDisplay({
  value,
  height = 80,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    loadJsBarcode()
      .then((JsBarcode) => {
        if (!svgRef.current) return;
        try {
          JsBarcode(svgRef.current, value, {
            format: "CODE128",
            width: 2,
            height: height,
            displayValue: true,
            fontSize: 14,
            margin: 8,
          });
        } catch (e) {
          console.error("JsBarcode error:", e);
        }
      })
      .catch((e) => console.error("Failed to load JsBarcode:", e));
  }, [value, height]);

  return <svg ref={svgRef} className="w-full" />;
}
