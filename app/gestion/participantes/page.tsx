"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Participant = {
  id: string
  name: string
  instagram: string
}

export default function ParticipantesPage() {

  const [participants, setParticipants] = useState<Participant[]>([])
  const [search, setSearch] = useState("")

useEffect(() => {

  const fetchParticipants = async () => {

    const { data, error } = await supabase
      .from("participants")
      .select("id,name,instagram")
      .order("name")

    if (!error) {
      setParticipants(data ?? [])
    }
  }

  fetchParticipants()

  const channel = supabase
    .channel("participants-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "participants",
      },
      () => {
        fetchParticipants()
      }
    )
    .subscribe((status) => {
    console.log("Realtime status:", status)
  })

  return () => {
    supabase.removeChannel(channel)
  }

}, [])

const updatePoints = async (id: string, delta: number) => {

  await fetch("/api/participants/update-points", {
    method: "POST",
    body: JSON.stringify({
      id,
      delta
    })
  })
}

  const filtered = participants.filter(p => {

    const text = `${p.name} ${p.instagram}`.toLowerCase()

    return text.includes(search.toLowerCase())
  })

  return (

    <div className="max-w-4xl mx-auto p-10">

      <Card>

        <CardHeader>
          <CardTitle>Participantes</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="mb-6">

            <Input
              placeholder="Buscar por nombre o instagram..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

          </div>

          <div className="space-y-3">

{filtered.map(p => (

  <div
    key={p.id}
    className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50 transition"
  >

    <div className="flex items-center gap-4">

      <div>

        <div className="font-medium text-lg">
          {p.name}
        </div>

        <div className="text-sm text-gray-500">
          @{p.instagram}
        </div>

      </div>

    </div>

    <div className="flex gap-3">

      <Button
        variant="outline"
        className="text-red-500 border-red-200 hover:bg-red-50"
        onClick={() => updatePoints(p.id, -100)}
      >
        -100
      </Button>

      <Button
        className="bg-green-600 hover:bg-green-700"
        onClick={() => updatePoints(p.id, 100)}
      >
        +100
      </Button>

    </div>

  </div>

))}

          </div>

          {filtered.length === 0 && (

            <div className="text-center text-gray-500 py-10">
              No hay resultados
            </div>

          )}

        </CardContent>

      </Card>

    </div>
  )
}