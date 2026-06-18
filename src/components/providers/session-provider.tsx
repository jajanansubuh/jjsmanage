"use client";

import React, { createContext, useContext } from "react";

export interface SessionUser {
  id: string;
  username: string;
  name: string | null;
  role: string;
  supplierId: string | null;
  permissions?: string[];
}

interface SessionContextType {
  user: SessionUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: false,
});

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: { user: SessionUser } | null;
}) {
  const value = {
    user: session?.user || null,
    loading: false,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
