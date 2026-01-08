// Placeholder app entry point.
// If you move away from the Wix HTML, you can build your UI here.
export function mount() {
  const el = document.getElementById("app");
  if (!el) return;
  el.innerHTML = `
    <div style="padding:16px;font-family:Arial,Helvetica,sans-serif">
      <h1 style="margin:0 0 8px 0;font-size:20px">Social Media Starter</h1>
      <p style="margin:0 0 12px 0">Client scaffold is running. Replace client/public/index.html or build your UI in client/src.</p>
      <p style="margin:0">API health: <a href="http://localhost:8080/api/health" target="_blank" rel="noreferrer">/api/health</a></p>
    </div>
  `;
}
