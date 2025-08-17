export default function Admin() {
  const Btn = ({ href, label }: { href: string; label: string }) => (
    <a href={href} style={{ textDecoration: 'none' }}>
      <button style={{ padding: '10px 14px' }}>{label}</button>
    </a>
  );
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Survey Files</h1>
      <p>Files are written to the <code>/data</code> folder on the server.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Btn href="/api/survey/download?type=participants" label="Participants" />
        <Btn href="/api/survey/download?type=events" label="Events" />
        <Btn href="/api/survey/download?type=images" label="Image Reactions" />
      </div>
    </main>
  );
}
