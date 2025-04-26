"use client";
import Link from "next/link";
import HomeLogo from "./components/HomeLogo";
import AccountSwitcher from "./components/AccountSwitcher";
import NavBar from "./components/NavBar";
import { useContext, useEffect, useRef, useState } from "react";
import { AccountContext } from "./components/AccountProvider";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const GALLERY_KEY = "galleryImages";
const STREAK_KEY = "conflictStreak";
const RELATIONSHIP_START = new Date(2023, 4, 2); // May 2, 2023 (month is 0-indexed)

export default function Home() {
  const { account } = useContext(AccountContext);
  const [images, setImages] = useState<string[]>([]);
  const [imgInput, setImgInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [lastConflict, setLastConflict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore sync for gallery
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, GALLERY_KEY, "main"), (docSnap) => {
      if (docSnap.exists()) {
        setImages(docSnap.data().images || []);
      } else {
        setImages([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);
  const handleAddImage = () => {
    if (!imgInput.trim()) return;
    const updated = [...images, imgInput.trim()];
    setImages(updated);
    setDoc(doc(db, GALLERY_KEY, "main"), { images: updated }, { merge: true });
    setImgInput("");
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) {
        const updated = [...images, url];
        setImages(updated);
        setDoc(doc(db, GALLERY_KEY, "main"), { images: updated }, { merge: true });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleDeleteImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    setDoc(doc(db, GALLERY_KEY, "main"), { images: updated }, { merge: true });
  };

  // Firestore sync for streak
  useEffect(() => {
    const unsub = onSnapshot(doc(db, STREAK_KEY, "main"), (docSnap) => {
      if (docSnap.exists()) {
        setStreak(docSnap.data().streak || 0);
        setLastConflict(docSnap.data().lastConflict || null);
      } else {
        setStreak(0);
        setLastConflict(null);
      }
    });
    return () => unsub();
  }, []);
  // Calculate streak days
  useEffect(() => {
    if (!lastConflict) return;
    const last = new Date(lastConflict);
    const now = new Date();
    const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    setStreak(diff);
  }, [lastConflict]);
  const handleReportConflict = (user: "Suban" | "Ojaswi") => {
    if (account !== user) return;
    setStreak(0);
    setLastConflict(new Date().toISOString());
    setDoc(doc(db, STREAK_KEY, "main"), { streak: 0, lastConflict: new Date().toISOString() }, { merge: true });
  };
  // Relationship days
  const today = new Date();
  const daysTogether = Math.floor((today.getTime() - RELATIONSHIP_START.getTime()) / (1000 * 60 * 60 * 24));
  const todayString = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen flex flex-col items-center pb-20" style={{ background: "#fff", color: "#333333" }}>
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4 justify-between">
          <HomeLogo />
          <AccountSwitcher />
        </div>
        {/* Image Gallery */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-[#FF6B6B]">Image Gallery</h2>
          <div className="flex items-center gap-2 mb-4">
            <input
              className="border rounded p-2 flex-1 bg-[#FFE3E3]"
              placeholder="Paste image URL or path..."
              value={imgInput}
              onChange={e => setImgInput(e.target.value)}
            />
            <button
              className="bg-[#FF6B6B] text-white px-4 py-2 rounded shadow hover:bg-[#ff8787] transition"
              onClick={handleAddImage}
              type="button"
            >
              +
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              className="bg-[#FF6B6B] text-white px-3 py-2 rounded shadow hover:bg-[#ff8787] transition"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              📁
            </button>
          </div>
          <div className="overflow-x-auto flex gap-4 pb-2" style={{ scrollSnapType: "x mandatory" }}>
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img}
                  alt="gallery"
                  className="h-32 w-48 object-cover rounded-xl border border-[#FFE3E3] shadow-sm transition-transform duration-200 hover:scale-105"
                  style={{ scrollSnapAlign: "start" }}
                />
                <button
                  className="absolute top-2 right-2 bg-[#FF6B6B] text-white rounded-full p-1 opacity-80 hover:opacity-100 transition text-xs hidden group-hover:block"
                  onClick={() => handleDeleteImage(i)}
                  type="button"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
        {/* Relationship Days Counter */}
        <section className="mb-8 flex flex-col items-center">
          <div className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-md mx-auto" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>Days of Being Together:</span>
            <span className="text-4xl font-bold mb-1" style={{ color: "#FF6B6B", fontFamily: 'serif' }}>{daysTogether} Days</span>
          </div>
        </section>
        {/* No Conflict Streak Tracker */}
        <section className="mb-8 flex flex-col items-center">
          <div className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-md mx-auto" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>No Conflict Streak:</span>
            <span className="text-4xl font-bold mb-2 flex items-center gap-2" style={{ color: "#FF6B6B", fontFamily: 'serif' }}>{streak} Days <span role="img" aria-label="fire">🔥</span></span>
            <div className="flex gap-4 mt-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#FFE3E3] text-[#FF6B6B] font-semibold text-lg border border-[#FF6B6B] disabled:opacity-50"
                onClick={() => handleReportConflict("Suban")}
                disabled={account !== "Suban"}
                type="button"
              >
                🔴 Report Conflict – Suban
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#FFE3E3] text-[#FF6B6B] font-semibold text-lg border border-[#FF6B6B] disabled:opacity-50"
                onClick={() => handleReportConflict("Ojaswi")}
                disabled={account !== "Ojaswi"}
                type="button"
              >
                🔴 Report Conflict – Ojaswi
              </button>
            </div>
          </div>
        </section>
        {/* Today's Date Card */}
        <section className="mb-8 flex flex-col items-center">
          <div className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-md mx-auto" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>Today's Date:</span>
            <span className="text-2xl font-bold" style={{ color: "#FF6B6B", fontFamily: 'serif' }}>{todayString}</span>
          </div>
        </section>
      </div>
      <NavBar />
    </main>
  );
}
