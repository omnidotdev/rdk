type GestureHUDProps = {
  gesture: string;
  confidence: number;
};

const GESTURE_LABELS: Record<string, string> = {
  thumbs_up: "Thumbs Up",
  peace: "Peace",
  ok: "OK",
  open_hand: "Open Hand",
  fist: "Fist",
};

const GestureHUD = ({ gesture, confidence }: GestureHUDProps) => {
  if (!gesture) return null;

  const label = GESTURE_LABELS[gesture] ?? gesture;

  return (
    <div
      style={{
        position: "fixed",
        top: "110px",
        left: "20px",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.9rem",
        zIndex: 1000,
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
        {Math.round(confidence * 100)}% confidence
      </div>
    </div>
  );
};

export default GestureHUD;
