"use client";

import { FormField, inputClass } from "../(admin)/shared/AdminFormModal";

const pad = (n: number) => String(n).padStart(2, "0");

/** value for <input type="date"> / <input type="time"> in the browser's local time */
export const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export interface DeliveryTimeValue {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

/** default suggestion: 3 days from now at 14:00 */
export const defaultDeliveryTime = (from?: string | Date | null): DeliveryTimeValue => {
  const base = from ? new Date(from) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  if (!from) base.setHours(14, 0, 0, 0);
  return { date: toDateInput(base), time: toTimeInput(base) };
};

/** local date + time → ISO string for the API (null when incomplete or invalid) */
export const deliveryTimeToIso = ({ date, time }: DeliveryTimeValue): string | null => {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** error text for the form, or null when fine (the backend checks the same rules) */
export const deliveryTimeError = (value: DeliveryTimeValue): string | null => {
  const iso = deliveryTimeToIso(value);
  if (!iso) return "Pick the delivery date and time";
  const t = new Date(iso).getTime();
  if (t < Date.now() - 5 * 60 * 1000) return "The delivery time can't be in the past";
  if (t > Date.now() + 60 * 24 * 60 * 60 * 1000) return "Pick a time within the next 60 days";
  return null;
};

interface Props {
  value: DeliveryTimeValue;
  onChange: (value: DeliveryTimeValue) => void;
  error?: string | null;
}

/** "Expected delivery" date + time inputs — the buyer sees exactly this and gets notified */
export default function DeliveryTimeFields({ value, onChange, error }: Props) {
  const today = toDateInput(new Date());

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Expected delivery date">
          <input
            type="date"
            required
            min={today}
            className={inputClass}
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
          />
        </FormField>
        <FormField label="Around (time)">
          <input
            type="time"
            required
            className={inputClass}
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
          />
        </FormField>
      </div>
      <p className={`text-[11px] ${error ? "text-[var(--destructive)]" : "text-[var(--foreground-muted)]"}`}>
        {error || "The buyer sees this day and time in their order and gets a notification."}
      </p>
    </div>
  );
}
