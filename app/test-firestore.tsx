"use client";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function TestFirestore() {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "testCollection"));
      setDocs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const addTestDoc = async () => {
    await addDoc(collection(db, "testCollection"), { timestamp: Date.now() });
    alert("Document added! Refresh to see it.");
  };

  return (
    <div>
      <button onClick={addTestDoc}>Add Test Document</button>
      <ul>
        {docs.map(doc => (
          <li key={doc.id}>{JSON.stringify(doc)}</li>
        ))}
      </ul>
    </div>
  );
} 