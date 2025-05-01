"use client";
import Link from "next/link";
import HomeLogo from "./components/HomeLogo";
import AccountSwitcher from "./components/AccountSwitcher";
import NavBar from "./components/NavBar";
import { useContext, useEffect, useRef, useState } from "react";
import { AccountContext } from "./components/AccountProvider";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";

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
  const storage = getStorage();
  const [today, setToday] = useState(new Date());
  const [daysTogether, setDaysTogether] = useState(Math.floor((new Date().getTime() - RELATIONSHIP_START.getTime()) / (1000 * 60 * 60 * 24)));
  const [todayString, setTodayString] = useState(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);

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
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);
    try {
      const storageRef = ref(storage, `gallery/${account}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const updated = [...images, url];
      await setDoc(doc(db, GALLERY_KEY, "main"), { images: updated }, { merge: true });
      setImages(updated);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 1200);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError("Failed to upload image: " + err.message);
    } finally {
      setUploading(false);
    }
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
  useEffect(() => {
    const now = new Date();
    setToday(now);
    setDaysTogether(Math.floor((now.getTime() - RELATIONSHIP_START.getTime()) / (1000 * 60 * 60 * 24)));
    setTodayString(now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center pb-20" style={{ background: "linear-gradient(135deg, #fff0f6 0%, #f8f9fa 100%)", color: "#333333", fontFamily: 'Nunito, sans-serif' }}>
      {/* Hero Section */}
      <section style={{ width: "100%", background: "linear-gradient(135deg, #ffdde1 0%, #ee9ca7 100%)", borderBottomLeftRadius: 32, borderBottomRightRadius: 32, boxShadow: "0 4px 24px #e6394611", padding: "2.5rem 0 1.5rem 0", marginBottom: 32 }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120 }}>
            <span style={{ fontSize: 48, color: "#e63946", display: "inline-block", marginBottom: 8 }}>💓</span>
          </motion.div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#e63946", fontFamily: 'Nunito, sans-serif' }}>Welcome to LoveEnhancer</h1>
          <p className="text-lg mb-2" style={{ color: "#b5838d" }}>Cherish every moment together.</p>
        </div>
      </section>
      <div className="w-full max-w-4xl mx-auto">
        {/* Animated Counters */}
        <section className="mb-8 flex flex-col md:flex-row gap-6 items-center justify-center">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-xs mx-auto" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>Days Together</span>
            <motion.span className="text-4xl font-bold mb-1" style={{ color: "#FF6B6B", fontFamily: 'serif' }} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>{daysTogether} <span role="img" aria-label="love">💑</span></motion.span>
          </motion.div>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-xs mx-auto" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>No Conflict Streak</span>
            <motion.span className="text-4xl font-bold mb-2 flex items-center gap-2" style={{ color: "#FF6B6B", fontFamily: 'serif' }} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>{streak} <span role="img" aria-label="fire">🔥</span></motion.span>
          </motion.div>
        </section>
        {/* Image Gallery */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-[#FF6B6B]">Image Gallery</h2>
          <div className="relative">
            <div className="overflow-x-auto flex gap-4 pb-2" style={{ scrollSnapType: "x mandatory", minHeight: 140 }}>
              {images.map((img, i) => (
                <motion.div key={i} className="relative group" whileHover={{ scale: 1.07 }} style={{ cursor: "pointer" }}>
                  <img
                    src={img}
                    alt="gallery"
                    className="h-32 w-48 object-cover rounded-xl border border-[#FFE3E3] shadow-sm transition-transform duration-200 hover:scale-105"
                    style={{ scrollSnapAlign: "start" }}
                    onClick={() => setModalImg(img)}
                  />
                  <AnimatePresence>
                    {uploading && i === images.length - 1 && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-2 left-2 right-2 flex flex-col items-center z-10">
                        <motion.div animate={{ rotate: [0, 20, -20, 0] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 28, color: "#e63946" }}>💘</motion.div>
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-xs font-bold text-white bg-[#e63946] px-2 py-1 rounded-full shadow-lg mt-1" style={{ letterSpacing: 1 }}>Uploading...</motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    className="absolute top-2 right-2 bg-[#FF6B6B] text-white rounded-full p-1 opacity-80 hover:opacity-100 transition text-xs hidden group-hover:block"
                    onClick={() => handleDeleteImage(i)}
                    type="button"
                    title="Delete"
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
            {/* Floating Upload Button */}
            <motion.button
              className="fixed bottom-24 right-8 bg-[#e63946] text-white rounded-full shadow-lg p-4 z-50 hover:bg-[#ff8787] transition flex items-center gap-2"
              style={{ fontSize: 28, boxShadow: "0 4px 24px #e6394611" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Upload Image"
            >
              <span role="img" aria-label="upload">➕</span>
            </motion.button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-1/2 -translate-x-1/2 top-0 z-20 flex flex-col items-center">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 32, color: "#e63946" }}>💘</motion.div>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-xs font-bold text-white bg-[#e63946] px-2 py-1 rounded-full shadow-lg mt-1" style={{ letterSpacing: 1 }}>Uploading...</motion.div>
            </motion.div>}
          </div>
          {uploadSuccess && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center mt-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 2, duration: 0.7 }} style={{ fontSize: 28, color: "#e63946", display: "inline-block" }}>💘</motion.div>
            <span className="ml-2 text-[#e63946] font-bold bg-white px-3 py-1 rounded-full shadow">Uploaded!</span>
          </motion.div>}
          {uploadError && <div className="text-red-500 mb-2 text-center font-semibold">{uploadError}</div>}
          {/* Modal for image view */}
          <AnimatePresence>
            {modalImg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalImg(null)}>
                <motion.img src={modalImg} alt="Large view" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ maxHeight: "80vh", maxWidth: "90vw", borderRadius: 24, boxShadow: "0 8px 32px #e6394611" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        {/* Today's Date Card */}
        <section className="mb-8 flex flex-col items-center">
          <div className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-md mx-auto" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>Today's Date:</span>
            <span className="text-2xl font-bold" style={{ color: "#FF6B6B", fontFamily: 'serif' }}>{todayString}</span>
          </div>
        </section>
        {/* Vercel AI Link */}
        <section className="mb-8 flex flex-col items-center">
          <a href="https://relationship-tracker.vercel.app" target="_blank" rel="noopener noreferrer" className="rounded-xl shadow p-6 border border-[#FFE3E3] flex flex-col items-center w-full max-w-md mx-auto hover:bg-[#FFF9F4] transition" style={{ background: "#FFF9F4" }}>
            <span className="text-lg font-serif mb-2" style={{ color: "#333333" }}>Access on Vercel AI</span>
            <span className="text-2xl font-bold" style={{ color: "#FF6B6B", fontFamily: 'serif' }}>Click Here</span>
          </a>
        </section>
      </div>
      <NavBar />
    </main>
  );
}
