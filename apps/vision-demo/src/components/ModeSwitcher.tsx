import {
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemHiddenInput,
  SegmentGroupItemText,
  SegmentGroupRoot,
} from "@omnidotdev/thornberry/segment-group";

import { MODE_ORDER, MODES } from "@/lib/modes";

import type { Mode } from "@/lib/modes";

type ModeSwitcherProps = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

/** Pill control for the demo modes, icon over label so all five fit a phone */
const ModeSwitcher = ({ mode, onModeChange }: ModeSwitcherProps) => (
  <SegmentGroupRoot
    value={mode}
    onValueChange={({ value }) => value && onModeChange(value as Mode)}
    aria-label="Tracking mode"
    className="border-border bg-card w-full max-w-md justify-between rounded-xl border p-1 shadow-lg backdrop-blur-md"
  >
    <SegmentGroupIndicator className="bg-primary/15 ring-primary/40 rounded-lg ring-1" />
    {MODE_ORDER.map((key) => {
      const { label, icon: Icon } = MODES[key];

      return (
        <SegmentGroupItem
          key={key}
          value={key}
          className="data-[state=checked]:text-primary h-auto flex-1 flex-col gap-1 px-1 py-2 text-xs"
        >
          <Icon className="size-5" aria-hidden />
          <SegmentGroupItemText>{label}</SegmentGroupItemText>
          <SegmentGroupItemHiddenInput />
        </SegmentGroupItem>
      );
    })}
  </SegmentGroupRoot>
);

export default ModeSwitcher;
