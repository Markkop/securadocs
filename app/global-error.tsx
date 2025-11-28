"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#fafafa",
          }}
        >
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                marginBottom: "24px",
              }}
            >
              <AlertTriangle
                style={{ width: "40px", height: "40px", color: "#ef4444" }}
              />
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Erro Crítico
            </h1>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "16px",
              }}
            >
              Ocorreu um erro crítico na aplicação. Por favor, tente recarregar
              a página.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  fontFamily: "monospace",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  display: "inline-block",
                  marginBottom: "24px",
                }}
              >
                Código: {error.digest}
              </p>
            )}
            <div style={{ marginTop: "24px" }}>
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#18181b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <RefreshCcw style={{ width: "16px", height: "16px" }} />
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
