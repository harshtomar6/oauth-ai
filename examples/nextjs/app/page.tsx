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

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap" }}>
        <ConnectButton provider="openai" />
        <ConnectButton provider="anthropic" />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <ConnectButton
          provider="anthropic"
          href="/api/oauth-ai/connect/anthropic?mode=manual"
          label="Connect with Claude (manual / copy-paste)"
          style={{ background: "#6b7280" }}
        />
        <p style={{ color: "#888", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
          Manual mode works anywhere (no loopback port needed): Claude shows a
          code you paste back. This is the only option for hosted sites today.
        </p>
      </div>

      <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "2rem" }}>
        Each button links to <code>/api/oauth-ai/connect/&lt;provider&gt;</code>,
        which starts the OAuth (PKCE) <strong>loopback</strong> flow and redirects
        you to the provider, then back to a registered callback path.
      </p>

      <ul style={{ color: "#888", fontSize: "0.8125rem", lineHeight: 1.7 }}>
        <li>
          <strong>Claude</strong> works on this app as-is — its loopback redirect
          is port-agnostic (<code>http://localhost:3000/callback</code>).
        </li>
        <li>
          <strong>OpenAI</strong> requires the Codex loopback port:
          run <code>PORT=1455 pnpm dev</code> so the redirect
          (<code>http://localhost:1455/auth/callback</code>) is accepted.
        </li>
      </ul>

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
