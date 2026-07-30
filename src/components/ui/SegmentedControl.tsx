import React, { useRef } from "react";

export type SegmentedControlOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export interface SegmentedControlProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}) => {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledOptions = options.filter((option) => !(disabled || option.disabled));
  const selectedIndex = options.findIndex((option) => option.value === value);
  const focusedIndex = selectedIndex >= 0 ? selectedIndex : Math.max(options.findIndex((option) => !(disabled || option.disabled)), 0);

  const focusOption = (index: number) => {
    const option = options[index];
    if (!option || disabled || option.disabled) return;
    optionRefs.current[index]?.focus();
    onChange(option.value);
  };

  const moveFocus = (currentIndex: number, direction: 1 | -1) => {
    if (!enabledOptions.length) return;

    for (let offset = 1; offset <= options.length; offset += 1) {
      const nextIndex = (currentIndex + direction * offset + options.length) % options.length;
      const nextOption = options[nextIndex];
      if (!nextOption || disabled || nextOption.disabled) continue;
      focusOption(nextIndex);
      return;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveFocus(index, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveFocus(index, -1);
        break;
      case "Home":
        event.preventDefault();
        focusOption(0);
        break;
      case "End":
        event.preventDefault();
        focusOption(options.length - 1);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        focusOption(index);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid grid-cols-1 gap-2 rounded-xl border border-[#1f2937] bg-white p-1 shadow-sm sm:grid-cols-2 ${className}`}
    >
      {options.map((option, index) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            aria-disabled={disabled || option.disabled}
            disabled={disabled || option.disabled}
            tabIndex={focusedIndex === index ? 0 : -1}
            name={name}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={[
              "flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-[#000dff]/30 focus:ring-offset-2 focus:ring-offset-white",
              selected
                ? "border-[#000dff] bg-[#000dff] text-white shadow-sm"
                : "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
              disabled || option.disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "flex items-center justify-center transition-colors duration-200",
                selected ? "text-white" : "text-[#000dff]",
              ].join(" ")}
            >
              {option.icon}
            </span>
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
