"use client";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import HomeLogo from "../components/HomeLogo";
import NavBar from "../components/NavBar";
import AccountSwitcher from "../components/AccountSwitcher";
import { useContext } from "react";
import { AccountContext } from "../components/AccountProvider";

const users = ["Suban", "Ojaswi"];
const defaultReflection = {
  suban: {
    appreciated: "",
    hurt: "",
    general: "",
  },
  ojaswi: {
    appreciated: "",
    hurt: "",
    general: "",
  },
};
const defaultEnergy = {
  suban: 0,
  ojaswi: 0,
};
const defaultVault = {
  suban: "",
  ojaswi: "",
};

export default function LoveEnhancer() {
  const { account } = useContext(AccountContext);
  const [date, setDate] = useState(new Date());
  const [reflection, setReflection] = useState(defaultReflection);
  const [energy, setEnergy] = useState(defaultEnergy);
  const [vault, setVault] = useState(defaultVault);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dateKey = format(date, "yyyy-MM-dd");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Firestore sync
  useEffect(() => {
    setLoading(true);
    setError("");
    setReflection(defaultReflection);
    setEnergy(defaultEnergy);
    const unsubReflection = onSnapshot(
      doc(db, "loveReflection", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setReflection({ ...defaultReflection, ...docSnap.data() });
        }
        setLoading(false);
      },
      (err) => setError("Error loading reflection: " + err.message)
    );
    const unsubEnergy = onSnapshot(
      doc(db, "loveEnergy", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setEnergy({ ...defaultEnergy, ...docSnap.data() });
        }
      },
      (err) => setError("Error loading energy: " + err.message)
    );
    const unsubVault = onSnapshot(
      doc(db, "loveVault", "global"),
      (docSnap) => {
        if (docSnap.exists()) {
          setVault({ ...defaultVault, ...docSnap.data() });
        }
      },
      (err) => setError("Error loading vault: " + err.message)
    );
    return () => {
      unsubReflection();
      unsubEnergy();
      unsubVault();
    };
    // eslint-disable-next-line
  }, [dateKey]);

  // Save reflection
  const handleReflectionChange = (user: "Suban" | "Ojaswi", field: keyof typeof defaultReflection.suban, value: string) => {
    const newReflection = {
      ...reflection,
      [user.toLowerCase()]: {
        ...reflection[user.toLowerCase() as "suban" | "ojaswi"],
        [field]: value,
      },
    };
    setReflection(newReflection);
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    setDoc(doc(db, "loveReflection", dateKey), newReflection, { merge: true })
      .then(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1200);
      })
      .catch((err) => setSaveError("Failed to save: " + err.message))
      .finally(() => setSaving(false));
  };
  // Save energy
  const handleEnergyChange = (user: "Suban" | "Ojaswi", value: number) => {
    const newEnergy = { ...energy, [user.toLowerCase()]: value };
    setEnergy(newEnergy);
    setDoc(doc(db, "loveEnergy", dateKey), newEnergy, { merge: true });
  };
  // Save vault
  const handleVaultChange = (user: "Suban" | "Ojaswi", value: string) => {
    const newVault = { ...vault, [user.toLowerCase()]: value };
    setVault(newVault);
    setDoc(doc(db, "loveVault", "global"), newVault, { merge: true });
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 flex flex-col items-center text-black pb-20">
      <div className="w-full max-w-4xl mx-auto">
        {loading && <div className="mb-4 text-gray-500">Loading...</div>}
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {/* Logo + Account Switcher */}
        <div className="flex items-center gap-4 mb-4 justify-between">
          <HomeLogo />
          <AccountSwitcher />
        </div>
        {/* Calendar */}
        <div className="mb-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-white rounded-xl shadow p-4 border border-[#e9ecef]">
            <Calendar
              onChange={(value) => setDate(value as Date)}
              value={date}
              className="!border-0"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="font-semibold">Selected Date:</div>
            <div className="text-lg bg-[#fffbe6] rounded px-3 py-2 border border-[#ffe066] w-fit">{format(date, "EEE, MMM d, yyyy")}</div>
          </div>
        </div>
        {/* Daily Reflection */}
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>Daily Reflection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((u) => (
              <div key={u} className="flex-1">
                <h4 className="font-semibold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>{u}</h4>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Thing my partner did I appreciated most today</label>
                  <textarea
                    className="w-full border rounded p-2 bg-[#f8f9fa]"
                    value={reflection[u.toLowerCase() as "suban" | "ojaswi"].appreciated}
                    onChange={e => account === u && handleReflectionChange(u as "Suban" | "Ojaswi", "appreciated", e.target.value)}
                    readOnly={account !== u}
                    placeholder="Write here..."
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Thing my partner did that hurt me today</label>
                  <textarea
                    className="w-full border rounded p-2 bg-[#f8f9fa]"
                    value={reflection[u.toLowerCase() as "suban" | "ojaswi"].hurt}
                    onChange={e => account === u && handleReflectionChange(u as "Suban" | "Ojaswi", "hurt", e.target.value)}
                    readOnly={account !== u}
                    placeholder="Write here..."
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Thing that is hurting me in general</label>
                  <textarea
                    className="w-full border rounded p-2 bg-[#f8f9fa]"
                    value={reflection[u.toLowerCase() as "suban" | "ojaswi"].general}
                    onChange={e => account === u && handleReflectionChange(u as "Suban" | "Ojaswi", "general", e.target.value)}
                    readOnly={account !== u}
                    placeholder="Write here..."
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Daily Energy Tracker */}
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>Daily Energy Level Tracker</h3>
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="bg-[#f8f9fa]">
                <th>Date</th>
                <th>Suban</th>
                <th>Ojaswi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{format(date, "yyyy-MM-dd")}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-16 border rounded p-1 bg-[#f8f9fa]"
                    value={energy.suban}
                    onChange={e => account === "Suban" && handleEnergyChange("Suban", Number(e.target.value))}
                    readOnly={account !== "Suban"}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-16 border rounded p-1 bg-[#f8f9fa]"
                    value={energy.ojaswi}
                    onChange={e => account === "Ojaswi" && handleEnergyChange("Ojaswi", Number(e.target.value))}
                    readOnly={account !== "Ojaswi"}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        {/* Emotional Vault */}
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold" style={{ color: '#e63946', fontWeight: 700 }}>Emotional Vault</h3>
            <button
              className="ml-2 px-3 py-1 rounded bg-[#e9ecef] text-black font-semibold text-sm border border-[#e9ecef] hover:bg-[#ffe066]"
              onClick={() => setVaultOpen((v) => !v)}
            >
              {vaultOpen ? "Lock Vault" : "Unlock Vault"}
            </button>
          </div>
          {vaultOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {users.map((u) => (
                <div key={u} className="flex-1">
                  <h4 className="font-semibold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>{u}'s Vault</h4>
                  <textarea
                    className="w-full border rounded p-2 bg-[#f8f9fa]"
                    value={vault[u.toLowerCase() as "suban" | "ojaswi"]}
                    onChange={e => account === u && handleVaultChange(u as "Suban" | "Ojaswi", e.target.value)}
                    readOnly={account !== u}
                    placeholder="Write a loving message for tough times..."
                  />
                </div>
              ))}
            </div>
          )}
        </section>
        {saving && <div className="text-blue-500 mb-2 animate-pulse">Saving...</div>}
        {saveSuccess && <div className="text-green-600 mb-2">Saved ✔️</div>}
        {saveError && <div className="text-red-500 mb-2">{saveError}</div>}
      </div>
      <NavBar />
    </main>
  );
} 