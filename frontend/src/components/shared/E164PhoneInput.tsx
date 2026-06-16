"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface E164PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function E164PhoneInput({
  value, onChange, placeholder = "+14155551234", disabled, error, className,
}: E164PhoneInputProps) {
  const [local, setLocal] = useState(value);
  const [isValid, setIsValid] = useState(true);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLocal(raw);
    const parsed = parsePhoneNumberFromString(raw);
    setIsValid(!raw || !!parsed?.isValid());
    onChange(raw); // Parent gets raw, can validate with useE164 hook
  }

  function handleBlur() {
    // Auto-format on blur if valid
    const parsed = parsePhoneNumberFromString(local);
    if (parsed?.isValid()) {
      const formatted = parsed.formatInternational();
      setLocal(formatted);
      onChange(formatted);
    }
  }

  return (
    <div className={className}>
      <Input
        type="tel"
        value={local}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && "border-destructive", !isValid && local && "border-yellow-500")}
        aria-invalid={!!error || (!isValid && !!local)}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {!isValid && local && !error && (
        <p className="mt-1 text-xs text-yellow-600">Enter a valid international number (e.g. +14155551234)</p>
      )}
    </div>
  );
}
