import { ErrorPanel } from "../ErrorPanel";

interface AccessStatusProps {
  tier: string;
  allowed: boolean;
  resource?: string | null;
  upgrade_url?: string | null;
  error?: { message: string };
}

export function AccessStatus({
  tier,
  upgrade_url,
  error,
}: AccessStatusProps) {
  const is_premium = tier === "premium";
  if (error) {
    return <ErrorPanel error={error} />;
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb",
        maxWidth: "24rem",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: "600",
            backgroundColor: is_premium ? "#dcfce7" : "#fef9c3",
            color: is_premium ? "#15803d" : "#a16207",
          }}
        >
          {is_premium ? "Premium Plan" : "Free Plan"}
        </span>
      </div>

      {!is_premium && tier === "free" ? (
        <div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "1rem",
            }}
          >
            Get access to AI tutoring, hints, and personalized explanations.
          </p>
          {upgrade_url !== null && (
            <a
              href={upgrade_url}
              style={{
                display: "inline-block",
                padding: "0.5rem 1.25rem",
                backgroundColor: "#f59e0b",
                color: "#ffffff",
                fontWeight: "600",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Upgrade to Premium
            </a>
          )}
        </div>
      ) : (
        <div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#15803d",
              fontWeight: "500",
            }}
          >
            ✓ Premium Member
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Thank you for supporting the course!
          </p>
        </div>
      )}
    </div>
  );
}
