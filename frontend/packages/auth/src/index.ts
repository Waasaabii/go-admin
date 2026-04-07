import type { AppSession, ClientType } from "@suiyuan/types";

const SESSION_PREFIX = "suiyuan:session";

function readStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function createSessionManager(clientType: ClientType) {
  const storageKey = `${SESSION_PREFIX}:${clientType}`;

  return {
    read() {
      const storage = readStorage();
      if (!storage) {
        return null;
      }

      const raw = storage.getItem(storageKey);
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw) as AppSession;
      } catch {
        storage.removeItem(storageKey);
        return null;
      }
    },
    write(session: AppSession) {
      const storage = readStorage();
      storage?.setItem(storageKey, JSON.stringify(session));
    },
    clear() {
      const storage = readStorage();
      storage?.removeItem(storageKey);
    },
  };
}

export function isSessionExpired(session: AppSession | null) {
  if (!session?.expireAt) {
    return true;
  }

  return Number(new Date(session.expireAt)) <= Date.now();
}

export function toAuthorizationToken(session: AppSession | null) {
  if (!session?.token) {
    return "";
  }

  return `Bearer ${session.token}`;
}
