import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { AuthProvider } from "react-oidc-context";

const redirectUri = (window as any).env.REDIRECT_URL;
const clientId = (window as any).env.CLIENT_ID;
const authority = (window as any).env.AUTHORITY;
const cognitoDomain = (window as any).env.COGNITO_DOMAIN;

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
        <App
          redirectUri={redirectUri}
          cognitoDomain={cognitoDomain}
          clientId={clientId}
        />
      </AuthProvider>
    </MantineProvider>
  </StrictMode>
);
