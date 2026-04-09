import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { ThemeProvider, initializeTheme } from "@go-admin/design-tokens";
import { I18nProvider } from "@go-admin/i18n";
import { ToastViewport } from "@go-admin/ui-admin";

import { showcaseMessages } from "./i18n/showcase";
import { App } from "./app";
import "@go-admin/design-tokens/base.css";
import "@go-admin/design-tokens/default-theme.css";
import "@go-admin/ui-admin/styles.css";
import "./styles.css";

initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <I18nProvider messages={showcaseMessages} storageKey="go-admin:showcase:locale">
      <ThemeProvider>
        <App />
        <ToastViewport />
      </ThemeProvider>
    </I18nProvider>
  </BrowserRouter>,
);
