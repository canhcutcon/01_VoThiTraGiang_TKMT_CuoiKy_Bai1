import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import App from "./App-clean.tsx"; // ← Dùng version clean đã test
import App from "./App.tsx"; // ← Dùng version clean đã test
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
