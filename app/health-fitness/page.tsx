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

const dailyChecks = [
  "Meditation",
  "Yoga",
  "Walk",
  "Journal",
  "Phone Off 30 Minutes Before Sleep",
  "Time with Family",
];

const users = ["Suban", "Ojaswi"];
const defaultHealthLog: Record<'Suban' | 'Ojaswi', { checks: boolean[]; gratitude: string; collapsed?: boolean }> = {
  Suban: { checks: Array(dailyChecks.length).fill(false), gratitude: "", collapsed: false },
  Ojaswi: { checks: Array(dailyChecks.length).fill(false), gratitude: "", collapsed: false },
};

const dietCategories = [
  "Green Leafy Vegetables",
  "Protein",
  "Vegetables",
  "Fruits",
  "Grains",
  "Junk/Fast Food",
  "Healthy Fats",
  "Others",
];
const defaultDietLog: Record<'Suban' | 'Ojaswi', {
  foods: string;
  categories: Record<string, string[]>;
  rating: number;
  collapsed?: boolean;
}> = {
  Suban: {
    foods: "",
    categories: Object.fromEntries(dietCategories.map((c) => [c, []])),
    rating: 3,
    collapsed: false,
  },
  Ojaswi: {
    foods: "",
    categories: Object.fromEntries(dietCategories.map((c) => [c, []])),
    rating: 3,
    collapsed: false,
  },
};

export default function HealthFitness() {
  const [date, setDate] = useState(new Date());
  const [healthLog, setHealthLog] = useState(defaultHealthLog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dateKey = format(date, "yyyy-MM-dd");
  const { account } = useContext(AccountContext);
  const [dietLog, setDietLog] = useState(defaultDietLog);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState("");
  const [dietLoading, setDietLoading] = useState(false);
  const [dietError, setDietError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Firestore sync for health log
  useEffect(() => {
    setLoading(true);
    setError("");
    setHealthLog(defaultHealthLog); // Instantly reset UI
    const unsub = onSnapshot(
      doc(db, "healthLog", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setHealthLog({ ...defaultHealthLog, ...docSnap.data() });
        }
        setLoading(false);
      },
      (err) => setError("Error loading health log: " + err.message)
    );
    return () => unsub();
    // eslint-disable-next-line
  }, [dateKey]);

  // Firestore sync for diet log
  useEffect(() => {
    setDietLog(defaultDietLog);
    const unsub = onSnapshot(
      doc(db, "dietLog", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setDietLog({ ...defaultDietLog, ...docSnap.data() });
        }
      }
    );
    return () => unsub();
    // eslint-disable-next-line
  }, [dateKey]);

  const handleCheck = (user: "Suban" | "Ojaswi", idx: number) => {
    const updated = {
      ...healthLog,
      [user]: {
        ...healthLog[user],
        checks: healthLog[user].checks.map((v, i) => (i === idx ? !v : v)),
      },
    };
    setHealthLog(updated);
    setDoc(doc(db, "healthLog", dateKey), updated, { merge: true });
  };
  const handleGratitude = (user: "Suban" | "Ojaswi", value: string) => {
    const updated = {
      ...healthLog,
      [user]: { ...healthLog[user], gratitude: value },
    };
    setHealthLog(updated);
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    setDoc(doc(db, "healthLog", dateKey), updated, { merge: true })
      .then(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1200);
      })
      .catch((err) => setSaveError("Failed to save: " + err.message))
      .finally(() => setSaving(false));
  };

  // Diet log handlers
  const handleFoods = (user: 'Suban' | 'Ojaswi', value: string) => {
    const updated = {
      ...dietLog,
      [user]: { ...dietLog[user], foods: value },
    };
    setDietLog(updated);
    setDoc(doc(db, "dietLog", dateKey), updated, { merge: true });
  };
  const handleCategoryDrop = (user: 'Suban' | 'Ojaswi', cat: string, food: string) => {
    // Remove from all categories, add to new
    const newCats = Object.fromEntries(
      dietCategories.map((c) => [c, dietLog[user].categories[c].filter((f) => f !== food)])
    );
    newCats[cat] = [...newCats[cat], food];
    const updated = {
      ...dietLog,
      [user]: { ...dietLog[user], categories: newCats },
    };
    setDietLog(updated);
    setDoc(doc(db, "dietLog", dateKey), updated, { merge: true });
  };
  const handleRating = (user: 'Suban' | 'Ojaswi', value: number) => {
    const updated = {
      ...dietLog,
      [user]: { ...dietLog[user], rating: value },
    };
    setDietLog(updated);
    setDoc(doc(db, "dietLog", dateKey), updated, { merge: true });
  };

  const handleGratitudeSave = async (user: "Suban" | "Ojaswi") => {
    setHealthLoading(true);
    setHealthError("");
    try {
      await setDoc(doc(db, "healthLog", dateKey), healthLog, { merge: true });
    } catch (err: any) {
      setHealthError("Failed to save health log: " + err.message);
    } finally {
      setHealthLoading(false);
    }
  };
  const handleDietSave = async (user: "Suban" | "Ojaswi") => {
    setDietLoading(true);
    setDietError("");
    try {
      await setDoc(doc(db, "dietLog", dateKey), dietLog, { merge: true });
    } catch (err: any) {
      setDietError("Failed to save diet log: " + err.message);
    } finally {
      setDietLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 flex flex-col items-center text-black pb-20">
      <div className="w-full max-w-4xl mx-auto">
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
        <h2 className="text-2xl font-bold mb-6 text-[#e63946] text-center">Health and Fitness Tracker</h2>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl mx-auto">
          {users.map((user) => {
            const typedUser = user as 'Suban' | 'Ojaswi';
            const canEdit = account === user;
            return (
              <section key={user} className="bg-white rounded-xl shadow p-4 border border-[#e9ecef] mb-4 w-full max-w-md mx-auto">
                <button
                  className="w-full flex justify-between items-center font-bold text-lg mb-2 px-2 py-2 border-b border-[#e9ecef] text-[#e63946]"
                  onClick={() => setHealthLog((prev) => ({ ...prev, [typedUser]: { ...prev[typedUser], collapsed: !prev[typedUser].collapsed } }))}
                  type="button"
                >
                  {user}'s Daily Health Log
                  <span className="text-xl">{healthLog[typedUser].collapsed ? "+" : "–"}</span>
                </button>
                {!healthLog[typedUser].collapsed && (
                  <div>
                    <div className="flex flex-col gap-2 mb-4">
                      {dailyChecks.map((label, idx) => (
                        <label
                          key={label}
                          className="flex items-center gap-2 px-2 py-2 rounded border border-[#f8f9fa] bg-[#f8f9fa]"
                        >
                          <input
                            type="checkbox"
                            checked={healthLog[typedUser].checks[idx]}
                            onChange={() => handleCheck(typedUser, idx)}
                            className="accent-[#e63946]"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mb-4 px-2">
                      <label className="block font-semibold mb-1 text-[#e63946]">What are you grateful for today?</label>
                      <textarea
                        className="w-full border rounded p-2 bg-[#f8f9fa]"
                        rows={2}
                        value={healthLog[typedUser].gratitude}
                        onChange={e => canEdit && handleGratitude(typedUser, e.target.value)}
                        placeholder="Write 1–2 things..."
                        readOnly={!canEdit}
                      />
                    </div>
                    <button
                      className="w-full bg-[#e63946] text-white font-semibold rounded py-2 mt-2 transition hover:bg-[#d62839]"
                      onClick={() => {}}
                      type="button"
                    >
                      Save Entry
                    </button>
                  </div>
                )}
                {saving && <div className="text-blue-500 mb-2 animate-pulse">Saving...</div>}
                {saveSuccess && <div className="text-green-600 mb-2">Saved ✔️</div>}
                {saveError && <div className="text-red-500 mb-2">{saveError}</div>}
              </section>
            );
          })}
        </div>
        {/* Diet Tracking Section */}
        <h2 className="text-2xl font-bold mb-6 text-[#e63946] text-center">Diet Tracking Section</h2>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl mx-auto">
          {users.map((user) => {
            const typedUser = user as 'Suban' | 'Ojaswi';
            const canEdit = account === user;
            // Foods list
            const foodList = dietLog[typedUser].foods.split(",").map(f => f.trim()).filter(Boolean);
            return (
              <section key={user} className="bg-white rounded-xl shadow p-4 border border-[#e9ecef] mb-4 w-full max-w-md mx-auto">
                <button
                  className="w-full flex justify-between items-center font-bold text-lg mb-2 px-2 py-2 border-b border-[#e9ecef] text-[#e63946]"
                  onClick={() => setDietLog((prev) => ({ ...prev, [typedUser]: { ...prev[typedUser], collapsed: !prev[typedUser].collapsed } }))}
                  type="button"
                >
                  {user}'s Diet Tracker
                  <span className="text-xl">{dietLog[typedUser].collapsed ? "+" : "–"}</span>
                </button>
                {!dietLog[typedUser].collapsed && (
                  <div>
                    <div className="mb-4 px-2">
                      <label className="block font-semibold mb-1 text-[#e63946]">Foods Eaten Today (comma separated)</label>
                      <input
                        className="w-full border rounded p-2 bg-[#f8f9fa]"
                        value={dietLog[typedUser].foods}
                        onChange={e => canEdit && handleFoods(typedUser, e.target.value)}
                        placeholder="e.g. Spinach, Chicken, Rice, Chips"
                        readOnly={!canEdit}
                      />
                    </div>
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dietCategories.map((cat) => (
                        <div
                          key={cat}
                          className="min-h-[60px] border border-[#e9ecef] rounded p-2 bg-[#f8f9fa] flex flex-col gap-1"
                          onDragOver={e => { if (canEdit) e.preventDefault(); }}
                          onDrop={e => {
                            if (!canEdit) return;
                            const food = e.dataTransfer.getData("text");
                            if (food) handleCategoryDrop(typedUser, cat, food);
                          }}
                        >
                          <div className="font-semibold text-[#e63946] mb-1 text-sm">{cat}</div>
                          {dietLog[typedUser].categories[cat].map((food) => (
                            <div
                              key={food}
                              className="px-2 py-1 bg-white rounded shadow text-xs border border-[#e9ecef] cursor-move"
                              draggable={canEdit}
                              onDragStart={e => { if (canEdit) e.dataTransfer.setData("text", food); }}
                            >
                              {food}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    {canEdit && foodList.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2 px-2">
                        {foodList.filter(f => !dietCategories.some(cat => dietLog[typedUser].categories[cat].includes(f))).map((food) => (
                          <div
                            key={food}
                            className="px-2 py-1 bg-[#ffe066] rounded shadow text-xs border border-[#e9ecef] cursor-move"
                            draggable={canEdit}
                            onDragStart={e => { if (canEdit) e.dataTransfer.setData("text", food); }}
                          >
                            {food}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mb-2 px-2">
                      <label className="block font-semibold mb-1 text-[#e63946]">Diet Rating</label>
                      <select
                        className="w-full border rounded p-2 bg-[#f8f9fa]"
                        value={dietLog[typedUser].rating}
                        onChange={e => canEdit && handleRating(typedUser, Number(e.target.value))}
                        disabled={!canEdit}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <NavBar />
    </main>
  );
} 