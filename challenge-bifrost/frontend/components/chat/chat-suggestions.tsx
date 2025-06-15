"use client";

interface Props {
  suggestions: readonly string[];
  onSelect: (s: string) => void;
  disabled?: boolean;
}

export default function ChatSuggestions({
  suggestions,
  onSelect,
  disabled,
}: Props) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="backdrop-blur-sm bg-white/5 text-sm py-2 px-4 rounded-full hover:bg-white/10 border border-white/10 text-white/80"
          disabled={disabled}
        >
          {s}
        </button>
      ))}
    </div>
  );
}