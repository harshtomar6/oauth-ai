import { ConnectButton } from "@oauth-ai/react";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>oauth-ai</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Add “Connect with OpenAI” / “Connect with Claude” to any app.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
        <ConnectButton provider="openai" />
        <ConnectButton provider="anthropic" />
      </div>

      <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "2rem" }}>
        Each button links to <code>/api/oauth-ai/connect/&lt;provider&gt;</code>,
        which starts the OAuth (PKCE) flow and redirects you to the provider.
      </p>

      <p
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 8,
          padding: "0.75rem 1rem",
          fontSize: "0.8125rem",
          color: "#9a3412",
          marginTop: "1.5rem",
        }}
      >
        ⚠️ This demo defaults to the vendors’ first-party client ids. Using them
        in a third-party app is a Terms-of-Service gray area — supply your own
        client ids in <code>.env.local</code> before shipping.
      </p>
    </main>
  );
}
