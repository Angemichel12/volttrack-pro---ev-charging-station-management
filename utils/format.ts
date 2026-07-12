// Display formatting — money is always whole Rwf (no decimals), energy is kW.

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return Number.isFinite(n) ? (n as number) : 0;
};

export const rwf = (v: string | number | null | undefined): string =>
  `Rwf ${Math.round(toNumber(v)).toLocaleString()}`;

export const kw = (v: string | number | null | undefined): string =>
  `${toNumber(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} kW`;
