import type { TenantContext } from "@suiyuan/types";

function isIpAddress(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

export function deriveTenantCode(hostname: string, fallback = "local"): TenantContext {
  const host = hostname.trim().toLowerCase();
  if (!host || host === "localhost" || isIpAddress(host)) {
    return {
      tenantCode: fallback,
      host,
    };
  }

  const segments = host.split(".");
  if (segments.length < 3) {
    return {
      tenantCode: fallback,
      host,
    };
  }

  return {
    tenantCode: segments[0] || fallback,
    host,
  };
}
