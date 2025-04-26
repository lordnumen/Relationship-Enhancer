"use client";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
  deleteField,
} from "firebase/firestore";
import HomeLogo from "../components/HomeLogo";
import NavBar from "../components/NavBar";
import AccountSwitcher from "../components/AccountSwitcher";
import { useContext } from "react";
import { AccountContext } from "../components/AccountProvider";

const defaultGoals = {
  daily: [],
  weekly: [],
  monthly: [],
};

const defaultFeedback = {
  suban: { text: "", rating: 0 },
  ojaswi: { text: "", rating: 0 },
};

const defaultTracker = {
  suban: {
    weeklyPlan: "",
    dailyPlan: "",
    summary: "",
    satisfaction: 0,
    love: 0,
    missed: "",
    feelings: "",
  },
  ojaswi: {
    weeklyPlan: "",
    dailyPlan: "",
    summary: "",
    satisfaction: 0,
    love: 0,
    missed: "",
    feelings: "",
  },
};

const users = ["Suban", "Ojaswi"];

export default function Tracker() {
  const { account } = useContext(AccountContext);
  const [date, setDate] = useState(new Date());
  const [tracker, setTracker] = useState(defaultTracker);
  const [goals, setGoals] = useState(defaultGoals);
  const [goalInput, setGoalInput] = useState("");
  const [goalType, setGoalType] = useState("daily");
  const [feedback, setFeedback] = useState(defaultFeedback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateKey = format(date, "yyyy-MM-dd");

  // Firestore sync: Load data on date/account change
  useEffect(() => {
    setLoading(true);
    setError("");
    setTracker(defaultTracker); // Instantly reset UI
    setGoals(defaultGoals);
    setFeedback(defaultFeedback);
    const unsubTracker = onSnapshot(
      doc(db, "tracker", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setTracker({ ...defaultTracker, ...docSnap.data() });
        }
        setLoading(false);
      },
      (err) => setError("Error loading tracker: " + err.message)
    );
    const unsubGoals = onSnapshot(
      doc(db, "goals", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setGoals({ ...defaultGoals, ...docSnap.data() });
        }
      },
      (err) => setError("Error loading goals: " + err.message)
    );
    const unsubFeedback = onSnapshot(
      doc(db, "feedback", dateKey),
      (docSnap) => {
        if (docSnap.exists()) {
          setFeedback({ ...defaultFeedback, ...docSnap.data() });
        }
      },
      (err) => setError("Error loading feedback: " + err.message)
    );
    return () => {
      unsubTracker();
      unsubGoals();
      unsubFeedback();
    };
    // eslint-disable-next-line
  }, [dateKey]);

  // Save tracker changes
  const handleTrackerChange = (user: "Suban" | "Ojaswi", field: keyof typeof defaultTracker.suban, value: string | number) => {
    const newTracker = {
      ...tracker,
      [user.toLowerCase()]: {
        ...tracker[user.toLowerCase() as "suban" | "ojaswi"],
        [field]: value,
      },
    };
    setTracker(newTracker);
    setDoc(doc(db, "tracker", dateKey), newTracker, { merge: true });
  };

  // Save goals changes
  const handleAddGoal = () => {
    if (!goalInput.trim()) return;
    const updated = {
      ...goals,
      [goalType]: [...goals[goalType as "daily" | "weekly" | "monthly"], goalInput.trim()],
    };
    setGoals(updated);
    setDoc(doc(db, "goals", dateKey), updated, { merge: true });
    setGoalInput("");
  };
  const handleDeleteGoal = (type: "daily" | "weekly" | "monthly", idx: number) => {
    const updated = {
      ...goals,
      [type]: goals[type].filter((_: string, i: number) => i !== idx),
    };
    setGoals(updated);
    setDoc(doc(db, "goals", dateKey), updated, { merge: true });
  };

  // Save feedback changes
  const handleFeedbackChange = (user: "Suban" | "Ojaswi", field: keyof typeof defaultFeedback.suban, value: string | number) => {
    const newFeedback = {
      ...feedback,
      [user.toLowerCase()]: {
        ...feedback[user.toLowerCase() as "suban" | "ojaswi"],
        [field]: value,
      },
    };
    setFeedback(newFeedback);
    setDoc(doc(db, "feedback", dateKey), newFeedback, { merge: true });
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 flex flex-col items-center text-black pb-20">
      <div className="w-full max-w-4xl mx-auto">
        {/* Logo + Account Switcher */}
        <div className="flex items-center gap-4 mb-4 justify-between">
          <HomeLogo />
          <AccountSwitcher />
        </div>
        {loading && <div className="mb-4 text-gray-500">Loading...</div>}
        {error && <div className="mb-4 text-red-500">{error}</div>}
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
        {/* Suban Tracker */}
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-xl font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>
            Suban Tracker
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Weekly Plan</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.weeklyPlan}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "weeklyPlan", e.target.value)}
                readOnly={account !== "Suban"}
                placeholder="Your weekly plan..."
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Daily Plan</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.dailyPlan}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "dailyPlan", e.target.value)}
                readOnly={account !== "Suban"}
                placeholder="Your daily plan..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Summary of the Day</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.summary}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "summary", e.target.value)}
                readOnly={account !== "Suban"}
                placeholder="How was your day..."
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Satisfaction Level (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.satisfaction}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "satisfaction", e.target.value)}
                readOnly={account !== "Suban"}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Love Level (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.love}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "love", e.target.value)}
                readOnly={account !== "Suban"}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Thoughts or Things Missed to Tell</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.missed}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "missed", e.target.value)}
                readOnly={account !== "Suban"}
                placeholder="Any thoughts..."
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Final Feelings of the Day</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.suban.feelings}
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "feelings", e.target.value)}
                readOnly={account !== "Suban"}
                placeholder="How do you feel..."
              />
            </div>
          </div>
        </section>
        {/* Ojaswi Tracker */}
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-xl font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>
            Ojaswi Tracker
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Weekly Plan</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.weeklyPlan}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "weeklyPlan", e.target.value)}
                readOnly={account !== "Ojaswi"}
                placeholder="Your weekly plan..."
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Daily Plan</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.dailyPlan}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "dailyPlan", e.target.value)}
                readOnly={account !== "Ojaswi"}
                placeholder="Your daily plan..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Summary of the Day</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.summary}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "summary", e.target.value)}
                readOnly={account !== "Ojaswi"}
                placeholder="How was your day..."
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Satisfaction Level (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.satisfaction}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "satisfaction", e.target.value)}
                readOnly={account !== "Ojaswi"}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Love Level (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.love}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "love", e.target.value)}
                readOnly={account !== "Ojaswi"}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Thoughts or Things Missed to Tell</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.missed}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "missed", e.target.value)}
                readOnly={account !== "Ojaswi"}
                placeholder="Any thoughts..."
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Final Feelings of the Day</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={tracker.ojaswi.feelings}
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "feelings", e.target.value)}
                readOnly={account !== "Ojaswi"}
                placeholder="How do you feel..."
              />
            </div>
          </div>
        </section>
        {/* Shared Goals */}
        <section className="mb-6 bg-[#f8f9fa] rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>
            Shared Goals
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              className="border rounded p-2 flex-1"
              placeholder="Add a new goal..."
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
            />
            <select className="border rounded p-2" value={goalType} onChange={e => setGoalType(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button className="bg-black text-white px-4 py-2 rounded" onClick={handleAddGoal} type="button">Add</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-1" style={{ color: '#e63946', fontWeight: 700 }}>Daily Goals</h4>
              {goals.daily.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-black" />{g}
                  <button className="ml-2 text-xs text-red-500 hover:underline" onClick={() => handleDeleteGoal("daily", i)} type="button">Delete</button>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: '#e63946', fontWeight: 700 }}>Weekly Goals</h4>
              {goals.weekly.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-black" />{g}
                  <button className="ml-2 text-xs text-red-500 hover:underline" onClick={() => handleDeleteGoal("weekly", i)} type="button">Delete</button>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: '#e63946', fontWeight: 700 }}>Monthly Goals</h4>
              {goals.monthly.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-black" />{g}
                  <button className="ml-2 text-xs text-red-500 hover:underline" onClick={() => handleDeleteGoal("monthly", i)} type="button">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Feedback */}
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>
            Rate Each Other & Feedback
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Suban's Feedback for Ojaswi</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={feedback.suban.text}
                onChange={e => account === "Suban" && handleFeedbackChange("Suban", "text", e.target.value)}
                readOnly={account !== "Suban"}
                placeholder="Write feedback for Ojaswi..."
              />
              <label className="block font-semibold mt-2">Rating (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={feedback.suban.rating}
                onChange={e => account === "Suban" && handleFeedbackChange("Suban", "rating", e.target.value)}
                readOnly={account !== "Suban"}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Ojaswi's Feedback for Suban</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={feedback.ojaswi.text}
                onChange={e => account === "Ojaswi" && handleFeedbackChange("Ojaswi", "text", e.target.value)}
                readOnly={account !== "Ojaswi"}
                placeholder="Write feedback for Suban..."
              />
              <label className="block font-semibold mt-2">Rating (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={feedback.ojaswi.rating}
                onChange={e => account === "Ojaswi" && handleFeedbackChange("Ojaswi", "rating", e.target.value)}
                readOnly={account !== "Ojaswi"}
              />
            </div>
          </div>
        </section>
      </div>
      <NavBar />
    </main>
  );
} 