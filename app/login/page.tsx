"use client";

import { useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, pass }),
    });

    if (res.ok) {
      window.location.href = "/gestion/participantes";
    } else {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-8">
        <h2 className="text-xl font-semibold mb-6 text-center text-purple-400">
          Acceso Staff
        </h2>

        <input
          placeholder="Usuario"
          className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded mb-3"
          onChange={(e) => setUser(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full bg-zinc-950 border border-zinc-700 text-white p-2 rounded mb-3"
          onChange={(e) => setPass(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
        )}

        <button
          onClick={login}
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded"
        >
          Acceder
        </button>
      </div>
    </div>
  );
}
