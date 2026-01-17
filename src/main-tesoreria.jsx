// src/main-tesoreria.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import PagoFirma from "./pages/PagoFirma.jsx";

registerSW();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App nivel="tesoreria" />
  </React.StrictMode>,
  { path: "/recibi/:recibiId", element: <PagoFirma /> }, // ← NUEVA
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);