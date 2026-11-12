import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import "../shared/base.css";
import "./deck.css";
import Deck from "./Deck.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Deck />
  </StrictMode>,
);
