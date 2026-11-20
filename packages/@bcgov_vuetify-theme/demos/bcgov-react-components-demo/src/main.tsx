import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "./App.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);