import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  label: string;
  onSigned: (file: File) => void;
  onClear: () => void;
}

export default function SignaturePad({
  label,
  onSigned,
  onClear,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const startDraw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    lastPos.current = { x, y };
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
  }, []);

  const draw = useCallback(
    (x: number, y: number) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas || !lastPos.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = { x, y };
    },
    [isDrawing],
  );

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `signature-${label}-${Date.now()}.png`, {
        type: "image/png",
      });
      setHasSigned(true);
      onSigned(file);
    }, "image/png");
  }, [isDrawing, label, onSigned]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent | Touch, canvas2: HTMLCanvasElement) => {
      const rect = canvas2.getBoundingClientRect();
      const scaleX = canvas2.width / rect.width;
      const scaleY = canvas2.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getPos(e, canvas);
      startDraw(pos.x, pos.y);
    };
    const handleMouseMove = (e: MouseEvent) => {
      const pos = getPos(e, canvas);
      draw(pos.x, pos.y);
    };
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getPos(touch, canvas);
      startDraw(pos.x, pos.y);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getPos(touch, canvas);
      draw(pos.x, pos.y);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", endDraw);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", endDraw);
    };
  }, [startDraw, draw, endDraw]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onClear();
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div
        className="relative border-2 border-border rounded-xl overflow-hidden bg-white"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full"
          style={{ height: "160px", cursor: "crosshair", display: "block" }}
        />
        {!hasSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm select-none">
              Rita din signatur här
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        {hasSigned ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Signerat
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Ej signerat</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 text-xs"
        >
          Rensa
        </Button>
      </div>
    </div>
  );
}
