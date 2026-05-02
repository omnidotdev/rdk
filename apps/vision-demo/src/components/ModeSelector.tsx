export type Mode = "hands" | "faces" | "poses";

type ModeSelectorProps = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

const BUTTON_STYLES = {
  padding: "12px 24px",
  fontSize: "16px",
  color: "#ccc",
  border: "2px solid #333",
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
  background: "#111",
  fontFamily: "system-ui, sans-serif",
} as const;

const ACTIVE_STYLES = {
  color: "white",
  background: "#1a2e2c",
  borderColor: "#4ecdc4",
} as const;

const MODES: { key: Mode; label: string }[] = [
  { key: "hands", label: "Hands" },
  { key: "faces", label: "Faces" },
  { key: "poses", label: "Poses" },
];

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => (
  <div
    style={{
      position: "fixed",
      bottom: "20px",
      display: "flex",
      justifyContent: "center",
      gap: "12px",
      width: "100%",
      zIndex: 1000,
    }}
  >
    {MODES.map(({ key, label }) => (
      <button
        key={key}
        type="button"
        onClick={() => onModeChange(key)}
        style={{
          ...BUTTON_STYLES,
          ...(mode === key ? ACTIVE_STYLES : {}),
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

export default ModeSelector;
