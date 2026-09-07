// Display formatting — money is always whole Rwf (no decimals), energy is kW.

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return Number.isFinite(n) ? (n as number) : 0;
};

export const rwf = (v: string | number | null | undefined): string =>
  `Rwf ${Math.round(toNumber(v)).toLocaleString()}`;

export const kw = (v: string | number | null | undefined): string =>
  `${toNumber(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} kW`;

// ISO datetime → value for a native <input type="datetime-local"> (local, no seconds).
export const toDateTimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// A datetime-local input value → ISO string for the API (empty → undefined).
export const fromDateTimeLocal = (v: string): string | undefined =>
  v ? new Date(v).toISOString() : undefined;
