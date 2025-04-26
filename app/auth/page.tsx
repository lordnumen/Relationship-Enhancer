import React from "react";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-pink-700 text-center">Login / Signup</h2>
        <form className="flex flex-col gap-4 mb-4">
          <input type="email" placeholder="Email" className="border rounded p-2" />
          <input type="password" placeholder="Password" className="border rounded p-2" />
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded p-2 transition">Login / Signup</button>
        </form>
        <div className="text-center text-gray-500 mb-2">or</div>
        <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded p-2 transition">
          <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.4 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.1-.3-3z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 15.7 3 8.3 8.6 6.3 14.7z"/><path fill="#FBBC05" d="M24 45c5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 36.1 27 37 24 37c-5.7 0-10.5-3.7-12.2-8.8l-7 5.4C8.3 39.4 15.7 45 24 45z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.2 5.5-7.7 5.5-4.7 0-8.6-3.8-8.6-8.5s3.9-8.5 8.6-8.5c2.1 0 4 .7 5.5 2.1l6.6-6.4C36.7 7.1 30.7 5 24 5c-8.3 0-15.7 5.6-18.7 13.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.1-.3-3z"/></g></svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
} 