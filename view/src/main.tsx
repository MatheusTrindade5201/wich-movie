import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

// CSS global para tema escuro
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
