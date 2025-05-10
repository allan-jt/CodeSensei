import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { AuthProvider } from "react-oidc-context";

// const redirectUri = (window as any).env.REDIRECT_URL;
// const clientId = (window as any).env.CLIENT_ID;
// const authority = (window as any).env.AUTHORITY;
// const socketURL = (window as any).env.SOCKET_URL;
// const httpURL = (window as any).env.HTTP_URL;

const redirectUri = "http://localhost:5173/";
const clientId = import.meta.env.VITE_CLIENT_ID;
const authority = import.meta.env.VITE_AUTHORITY;
const socketURL = import.meta.env.VITE_SOCKET_API_URL;
const httpURL = import.meta.env.VITE_HTTP_API_URL;

const cognitoAuthConfig = {
  authority: authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "email openid profile",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorSchemeScript forceColorScheme="dark" />
    <MantineProvider forceColorScheme="dark">
      <AuthProvider {...cognitoAuthConfig}>
        <App socketURL={socketURL} httpURL={httpURL} />
      </AuthProvider>
    </MantineProvider>
  </StrictMode>
);
