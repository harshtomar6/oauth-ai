import { cookies } from "next/headers";

interface Pending {
  provider: string;
  mode: string;
  authorizeUrl?: string;
}

export default function Manual() {
  const raw = cookies().get("oauthai_pending")?.value;
  const pending = raw ? (JSON.parse(raw) as Pending) : null;

  const wrap = {
    maxWidth: 640,
    margin: "0 auto",
    padding: "4rem 1.5rem",
  } as const;

  if (!pending || pending.mode !== "manual" || !pending.authorizeUrl) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: "1.5rem" }}>No pending authorization</h1>
        <p>
          Start again from the <a href="/">home page</a>.
        </p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: "1.5rem" }}>Connect {pending.provider} (manual)</h1>

      <ol style={{ lineHeight: 2 }}>
        <li>
          <a
            href={pending.authorizeUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "0.5rem 0.9rem",
              borderRadius: 6,
              background: "#d97757",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Open the provider to authorize ↗
          </a>
          <div style={{ color: "#666", fontSize: "0.875rem" }}>
            Approve access, then copy the code it displays.
          </div>
        </li>
        <li style={{ marginTop: "1.25rem" }}>
          Paste the code below and connect:
          <form
            method="POST"
            action="/api/oauth-ai/exchange"
            style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
          >
            <input
              name="code"
              placeholder="Paste code (the part after # is stripped for you)"
              autoComplete="off"
              style={{
                flex: 1,
                padding: "0.55rem 0.7rem",
                border: "1px solid #ccc",
                borderRadius: 6,
                font: "0.9rem monospace",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.55rem 1rem",
                border: "none",
                borderRadius: 6,
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Connect
            </button>
          </form>
        </li>
      </ol>

      <p style={{ marginTop: "2rem" }}>
        <a href="/">← Cancel</a>
      </p>
    </main>
  );
}
