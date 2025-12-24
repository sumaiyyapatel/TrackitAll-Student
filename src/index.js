import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Guard to prevent creating multiple roots (fixes duplicate mounts/spam when HMR or scripts re-run)
const container = document.getElementById("root");
if (!window.__TRACKITALL_REACT_ROOT__) {
  // store the root on window so subsequent evaluations don't recreate it
  window.__TRACKITALL_REACT_ROOT__ = ReactDOM.createRoot(container);
}

window.__TRACKITALL_REACT_ROOT__.render(
  <HashRouter>
    <App />
  </HashRouter>
);
