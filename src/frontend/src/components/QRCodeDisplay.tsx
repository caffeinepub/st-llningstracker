interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({
  value,
  size = 200,
}: QRCodeDisplayProps) {
  const encodedValue = encodeURIComponent(value);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&format=svg&margin=4`;

  return (
    <img
      src={src}
      alt={`QR-kod f\u00f6r ${value}`}
      width={size}
      height={size}
      className="rounded"
    />
  );
}
