"use client";
import { useState, useRef } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TestStorage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const storageRef = ref(storage, `testImages/${file.name}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError("Failed to upload image: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px #0001" }}>
      <h2>Test Storage Upload</h2>
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
        {uploading ? "Uploading..." : "Upload Image"}
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
      {error && <div style={{ color: "#e63946", marginTop: 8, fontWeight: 500 }}>{error}</div>}
      {imageUrl && !uploading && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{
              maxWidth: 320,
              borderRadius: 14,
              boxShadow: "0 4px 24px #e6394611",
              margin: "0 auto"
            }}
          />
        </div>
      )}
    </div>
  );
} 