"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// We'll use a fixed document for demo; in production, use user IDs or dates
const TRACKER_DOC_ID = "shared-daily-tracker";

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
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [note, setNote] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    setDoc(doc(db, "tracker", dateKey), newTracker, { merge: true })
      .then(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1200);
      })
      .catch((err) => setSaveError("Failed to save: " + err.message))
      .finally(() => setSaving(false));
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

  // Load daily notes and images for selected date
  useEffect(() => {
    setLoading(true);
    setNote("");
    setImageUrls([]);
    const unsub = onSnapshot(doc(db, "trackers", dateKey), (snapshot) => {
      const data = snapshot.data();
      setNote(data?.note || "");
      setImageUrls(Array.isArray(data?.imageUrls) ? data.imageUrls : data?.imageUrl ? [data.imageUrl] : []);
      setLoading(false);
    });
    return unsub;
  }, [dateKey]);

  // Auto-save note for selected date
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, "trackers", dateKey), { note, imageUrls }, { merge: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  // Auto-save image (add to gallery) for selected date
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const storageRef = ref(storage, `trackerImages/${dateKey}/${file.name}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const newImageUrls = [...imageUrls, url];
      setImageUrls(newImageUrls);
      // Save imageUrls array to Firestore
      await setDoc(doc(db, "trackers", dateKey), { imageUrls: newImageUrls }, { merge: true });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError("Failed to upload image: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  // Auto-save imageUrls to Firestore when changed (if not already handled)
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, "trackers", dateKey), { note, imageUrls }, { merge: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrls]);

  // Delete image from gallery for selected date
  const handleDeleteImage = (idx: number) => {
    const updated = imageUrls.filter((_, i) => i !== idx);
    setImageUrls(updated);
    setDoc(doc(db, "trackers", dateKey), { note, imageUrls: updated }, { merge: true });
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
        {trackerError && <div className="text-red-500 mb-2">{trackerError}</div>}
        {saving && <div className="text-blue-500 mb-2 animate-pulse">Saving...</div>}
        {saveSuccess && <div className="text-green-600 mb-2">Saved ✔️</div>}
        {saveError && <div className="text-red-500 mb-2">{saveError}</div>}
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
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "satisfaction", Number(e.target.value))}
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
                onChange={e => account === "Suban" && handleTrackerChange("Suban", "love", Number(e.target.value))}
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
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "satisfaction", Number(e.target.value))}
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
                onChange={e => account === "Ojaswi" && handleTrackerChange("Ojaswi", "love", Number(e.target.value))}
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
                onChange={e => handleFeedbackChange("Suban", "text", e.target.value)}
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
                onChange={e => handleFeedbackChange("Suban", "rating", e.target.value)}
                readOnly={account !== "Suban"}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Ojaswi's Feedback for Suban</label>
              <textarea
                className="w-full border rounded p-2 bg-[#f8f9fa]"
                value={feedback.ojaswi.text}
                onChange={e => handleFeedbackChange("Ojaswi", "text", e.target.value)}
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
                onChange={e => handleFeedbackChange("Ojaswi", "rating", e.target.value)}
                readOnly={account !== "Ojaswi"}
              />
            </div>
          </div>
        </section>
        <section className="mb-6 bg-white rounded-xl shadow p-6 border border-[#e9ecef]">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e63946', fontWeight: 700 }}>
            Daily Notes and Image
          </h3>
          <div style={{
            background: "linear-gradient(135deg, #f8fafc 60%, #e63946 100%)",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e6394611",
            padding: 24,
            marginBottom: 16,
            position: "relative",
            overflow: "hidden"
          }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write your notes here..."
              rows={6}
              style={{
                width: "100%",
                marginBottom: 16,
                fontSize: 18,
                padding: 14,
                borderRadius: 12,
                border: "1.5px solid #e63946",
                background: "#fff",
                boxShadow: "0 2px 8px #e6394611",
                outline: "none",
                transition: "border 0.2s"
              }}
            />
            <label
              htmlFor="image-upload"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: uploading ? "#e63946cc" : "#e63946",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: uploading ? "not-allowed" : "pointer",
                marginBottom: 12,
                boxShadow: uploading ? "0 0 0 2px #e6394633" : "0 2px 8px #e6394611",
                opacity: uploading ? 0.7 : 1,
                transition: "all 0.2s"
              }}
            >
              {uploading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="loader" style={{
                    width: 18, height: 18, border: "3px solid #fff", borderTop: "3px solid #e63946", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite"
                  }} />
                  Uploading...
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 20, marginRight: 8 }}>📷</span> Upload Image
                </>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={uploading}
              />
            </label>
            {uploadError && <div style={{ color: "#e63946", marginTop: 8, fontWeight: 500 }}>{uploadError}</div>}
            {imageUrls.length > 0 && !uploading && (
              <div style={{
                marginTop: 18,
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "center"
              }}>
                {imageUrls.map((url, idx) => (
                  <div key={url + idx} style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={url}
                      alt={`Uploaded ${idx + 1}`}
                      style={{
                        maxWidth: 160,
                        maxHeight: 160,
                        borderRadius: 14,
                        boxShadow: "0 4px 24px #e6394611",
                        margin: "0 auto"
                      }}
                    />
                    <button
                      onClick={() => handleDeleteImage(idx)}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        background: "#e63946",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        fontSize: 18,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px #e6394611",
                        opacity: 0.85,
                        transition: "opacity 0.2s"
                      }}
                      title="Delete image"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <NavBar />
    </main>
  );
} 