import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("CRM: NEW BOOT LOADER LOADED");

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
