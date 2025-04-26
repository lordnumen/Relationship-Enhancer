"use client";
import Link from "next/link";

export default function HomeLogo() {
  return (
    <Link href="/" className="inline-block mr-4" aria-label="Home">
      <span style={{ fontSize: "2.2rem", display: "inline-block", lineHeight: 1 }} role="img" aria-label="home">💓</span>
    </Link>
  );
} 