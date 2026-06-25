import React from "react";
import ReactDOM from "react-dom/client";
import "./presentation/theme/theme.css";
import App from "./App";
import { ErrorBoundary } from "./presentation/ui/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
