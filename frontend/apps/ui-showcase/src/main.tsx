import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { ThemeProvider, initializeTheme } from "@suiyuan/design-tokens";
import { I18nProvider } from "@suiyuan/i18n";
import { ToastViewport } from "@suiyuan/ui-admin";

import { showcaseMessages } from "./i18n/showcase";
import { App } from "./app";
import "@suiyuan/design-tokens/base.css";
import "@suiyuan/design-tokens/default-theme.css";
import "./styles.css";

initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <I18nProvider messages={showcaseMessages} storageKey="suiyuan:showcase:locale">
      <ThemeProvider>
        <App />
        <ToastViewport />
      </ThemeProvider>
    </I18nProvider>
  </BrowserRouter>,
);
