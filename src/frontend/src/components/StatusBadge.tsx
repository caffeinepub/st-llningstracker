import { TrailerStatus } from "../backend";

const STATUS_CONFIG: Record<
  TrailerStatus,
  { label: string; className: string }
> = {
  [TrailerStatus.available]: {
    label: "Tillgänglig",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  [TrailerStatus.out]: {
    label: "Ute",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  [TrailerStatus.returned]: {
    label: "Inlämnad",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  [TrailerStatus.incomplete]: {
    label: "Ofullständig",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
};

export default function StatusBadge({ status }: { status: TrailerStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
}
