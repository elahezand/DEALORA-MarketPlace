import { HiOutlineExclamationTriangle } from "react-icons/hi2";

/* error line under a field of the create-shop wizard */
export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
      <HiOutlineExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}
