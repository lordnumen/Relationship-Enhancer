"use client";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function TestFirestore() {
  const [docs, setDocs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // DEBUG: Show env variable
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, "testCollection"));
        setDocs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError("Error loading data: " + err.message);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Test Firestore Read</h2>
      <div style={{ color: "blue" }}>
        <b>DEBUG Project ID:</b> {projectId || "NOT LOADED"}
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {docs.map(doc => (
          <li key={doc.id}>{JSON.stringify(doc)}</li>
        ))}
      </ul>
    </div>
  );
} 