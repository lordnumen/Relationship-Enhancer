"use client";
import React, { createContext, useState } from "react";

export const AccountContext = createContext({
  account: "Suban",
  setAccount: (a: "Suban" | "Ojaswi") => {},
});

export default function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<"Suban" | "Ojaswi">("Suban");
  return (
    <AccountContext.Provider value={{ account, setAccount }}>
      {children}
    </AccountContext.Provider>
  );
} 