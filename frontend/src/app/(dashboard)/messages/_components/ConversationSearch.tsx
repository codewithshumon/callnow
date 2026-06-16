"use client";

import SearchInput from "@/components/shared/SearchInput";

interface Props { value: string; onChange: (v: string) => void; }

export default function ConversationSearch({ value, onChange }: Props) {
  return (
    <div className="px-4 pb-2">
      <SearchInput value={value} onChange={onChange} placeholder="Search conversations..." />
    </div>
  );
}
