import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@go-admin/design-tokens/base.css";
import "@go-admin/design-tokens/default-theme.css";
import "@go-admin/ui-mobile/styles.css";

import { App } from "./app";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
