export default function Connected({
  searchParams,
}: {
  searchParams: { provider?: string; ok?: string; error?: string };
}) {
  const { provider, ok, error } = searchParams;
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem" }}>
        {error ? "Connection failed" : "Connected"}
      </h1>
      {error ? (
        <p style={{ color: "#b91c1c" }}>
          {provider}: {error}
        </p>
      ) : ok ? (
        <p style={{ color: "#15803d" }}>
          Successfully connected <strong>{provider}</strong>. Tokens are stored
          server-side under <code>demo-user:{provider}</code>.
        </p>
      ) : (
        <p>Nothing to show.</p>
      )}
      <p style={{ marginTop: "2rem" }}>
        <a href="/">← Back</a>
      </p>
    </main>
  );
}
