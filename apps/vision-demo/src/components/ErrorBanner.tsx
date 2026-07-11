type ErrorBannerProps = {
  message: string;
};

const ErrorBanner = ({ message }: ErrorBannerProps) => (
  <div
    style={{
      position: "fixed",
      top: "110px",
      left: "20px",
      right: "20px",
      background: "rgba(200, 40, 40, 0.9)",
      color: "white",
      padding: "12px 16px",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "0.85rem",
      zIndex: 1000,
      maxWidth: "400px",
      wordBreak: "break-word",
    }}
  >
    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Vision Error</div>
    <div style={{ opacity: 0.9 }}>{message}</div>
  </div>
);

export default ErrorBanner;
