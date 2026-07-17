"use client";

export function NumberField({
  label,
  value,
  onChange,
  unit,
  step = 1,
  placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit?: string;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
        {unit ? ` (${unit})` : ""}
      </label>
      <input
        type="number"
        step={step}
        className="input-field"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </div>
  );
}
