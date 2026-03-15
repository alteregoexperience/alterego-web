"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/src/lib/supabase"

export default function RankingPage() {

  const [participants, setParticipants] = useState<any[]>([])

  const loadParticipants = async () => {
    const { data } = await supabase
      .from("participants")
      .select("*")
      .order("points", { ascending: false })

    setParticipants(data || [])
  }

  useEffect(() => {
    loadParticipants()

    const channel = supabase
      .channel("participants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadParticipants()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      <h1>Ranking</h1>

      {participants.map((p, i) => (
        <div key={p.id}>
          {i + 1}. {p.name} - {p.points}
        </div>
      ))}
    </div>
  )
}