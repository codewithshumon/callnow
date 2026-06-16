"use client";

import { useMemo } from "react";
import { parsePhoneNumberFromString, getCountryCallingCode } from "libphonenumber-js";

export function useE164(raw: string) {
  return useMemo(() => {
    if (!raw || raw.length < 3) return { isValid: false, formattedNumber: raw, countryCode: undefined as string | undefined };
    const parsed = parsePhoneNumberFromString(raw);
    return {
      isValid: !!parsed?.isValid(),
      formattedNumber: parsed?.formatInternational() || raw,
      countryCode: parsed?.country,
    };
  }, [raw]);
}
