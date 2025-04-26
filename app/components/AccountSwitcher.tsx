"use client";
import { useContext } from "react";
import { AccountContext } from "./AccountProvider";

const users = ["Suban", "Ojaswi"];

export default function AccountSwitcher() {
  const { account, setAccount } = useContext(AccountContext);
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">Logged in as:</span>
      {users.map((u) => (
        <button
          key={u}
          className={`px-4 py-2 rounded-full border ${account === u ? "bg-black text-white" : "bg-[#e9ecef] text-black"}`}
          onClick={() => setAccount(u as "Suban" | "Ojaswi")}
        >
          {u}
        </button>
      ))}
    </div>
  );
} 