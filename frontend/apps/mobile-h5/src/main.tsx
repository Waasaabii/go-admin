import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@suiyuan/design-tokens/base.css";
import "@suiyuan/design-tokens/default-theme.css";
import "@suiyuan/ui-mobile/styles.css";

import { App } from "./app";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
