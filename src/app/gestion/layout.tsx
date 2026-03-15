"use client"

import { useState } from "react"

export default function GestionLayout({ children }: any) {

  const [authorized, setAuthorized] = useState(false)
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")

  if (!authorized) {
    return (
      <div className="p-10">
        <input placeholder="user" onChange={e => setUser(e.target.value)} />
        <input placeholder="password" type="password" onChange={e => setPass(e.target.value)} />

        <button
          onClick={() => {
            if (
              user === process.env.NEXT_PUBLIC_ADMIN_USER &&
              pass === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
            ) {
              setAuthorized(true)
            }
          }}
        >
          Login
        </button>
      </div>
    )
  }

  return children
}