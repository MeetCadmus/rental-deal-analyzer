import { Component, type ErrorInfo, type ReactNode } from "react";
import { C } from "../theme/tokens";

interface Props { children: ReactNode }
interface State { error: Error | null }

// Catches render-time crashes so a single bad component can't blank the whole app.
// Your deals live in localStorage, so a reload recovers without data loss.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface in the console for diagnosis; no remote logging by design.
    console.error("App crashed:", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ fontFamily: "'Inter',system-ui,sans-serif", maxWidth: 520, margin: "12vh auto", padding: "0 20px", textAlign: "center", color: C.text }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontFamily: "var(--c-fdisp)", fontSize: 22, fontWeight: 600, color: C.heading, marginBottom: 8 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.5, marginBottom: 18 }}>
          The app hit an unexpected error. Your saved deals are stored locally and are safe — reloading usually fixes it.
        </div>
        <button onClick={() => location.reload()} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: C.navy, border: "none", borderRadius: "var(--c-rad)", padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em" }}>Reload</button>
        <details style={{ marginTop: 18, textAlign: "left" }}>
          <summary style={{ fontSize: 11, color: C.muted, cursor: "pointer" }}>Technical details</summary>
          <pre style={{ fontSize: 11, color: C.muted, whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 8 }}>{String(error?.stack || error?.message || error)}</pre>
        </details>
      </div>
    );
  }
}
