"use client"

import { useState } from "react"

export default function GestionLayout({ children }: any) {

  const [authorized, setAuthorized] = useState(false)
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [error, setError] = useState("")

  const login = async () => {

    const res = await fetch("/api/staff-login", {
      method: "POST",
      body: JSON.stringify({ user, pass })
    })

    if (res.ok) {
      setAuthorized(true)
    } else {
      setError("Credenciales incorrectas")
    }
  }

  if (!authorized) {

    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">

        <div className="bg-white p-8 rounded-xl shadow-md w-80">

          <h2 className="text-xl font-semibold mb-6 text-center">
            Staff Login
          </h2>

          <input
            placeholder="Usuario"
            className="border p-2 w-full mb-3 rounded"
            onChange={e => setUser(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-full mb-3 rounded"
            onChange={e => setPass(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm mb-3">
              {error}
            </p>
          )}

          <button
            onClick={login}
            className="w-full bg-black text-white py-2 rounded hover:opacity-90"
          >
            Entrar
          </button>

        </div>

      </div>
    )
  }

  return children
}