import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorSchemeScript forceColorScheme="dark" />
    <MantineProvider forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>
);
