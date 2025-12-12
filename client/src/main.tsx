import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, requestNotificationPermission } from "./pwa-register";

// Register PWA service worker
if (import.meta.env.PROD) {
  registerServiceWorker();
  // Request notification permission after a short delay
  setTimeout(requestNotificationPermission, 3000);
}

createRoot(document.getElementById("root")!).render(<App />);
