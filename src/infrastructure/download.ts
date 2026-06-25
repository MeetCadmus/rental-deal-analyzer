// Trigger a client-side file download (browser only).
export function downloadFile(name: string, text: string, type?: string): void {
  const blob = new Blob([text], { type: type || "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
