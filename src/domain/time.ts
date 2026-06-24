// Relative + compact absolute timestamps (pure aside from "now").

export function relTime(ts: number): string {
  if (!ts) return "";
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return d + " days ago";
  if (d < 30) return Math.floor(d / 7) + "w ago";
  if (d < 365) return Math.floor(d / 30) + "mo ago";
  return Math.floor(d / 365) + "y ago";
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// today -> "3:45p" · yesterday -> "Yest 3:45p" · this year -> "Jun 22, 3:45p" · older -> "Jun 22 '24"
export function fmtWhen(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  let h = d.getHours();
  const ap = h < 12 ? "a" : "p";
  h = h % 12 || 12;
  const time = h + ":" + String(d.getMinutes()).padStart(2, "0") + ap;
  const day = d.toDateString(), today = now.toDateString();
  const yest = new Date(now.getTime() - 86400000).toDateString();
  if (day === today) return time;
  if (day === yest) return "Yest " + time;
  const md = MON[d.getMonth()] + " " + d.getDate();
  return d.getFullYear() === now.getFullYear() ? md + ", " + time : md + " '" + String(d.getFullYear()).slice(2);
}
