import type { ErrorState } from "../types";

interface ErrorPanelProps {
  error: ErrorState;
}

export function ErrorPanel({ error }: ErrorPanelProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        color: "#ef4444",
        textAlign: "center",
      }}
    >
      <p>{error.message}</p>
    </div>
  );
}
