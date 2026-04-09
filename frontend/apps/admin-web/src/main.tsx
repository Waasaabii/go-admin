import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider, initializeTheme } from "@suiyuan/design-tokens";
import { ToastViewport } from "@suiyuan/ui-admin";

import { App } from "./app";
import "@suiyuan/design-tokens/base.css";
import "./admin-host-theme.css";
import "./styles.css";

const queryClient = new QueryClient();
initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastViewport />
    </QueryClientProvider>
  </ThemeProvider>,
);
