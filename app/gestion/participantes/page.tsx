"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Participant } from "@/types/Participant"

export default function ParticipantesPage() {

  const [participants, setParticipants] = useState<Participant[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {

    const fetchParticipants = async () => {

      const { data, error } = await supabase
        .from("participants")
        .select("id,name,instagram,points")
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [])

  const updatePoints = async (id: string, delta: number) => {

    await fetch("/api/participants/update-points", {
      method: "POST",
      body: JSON.stringify({ id, delta })
    })
  }

  const filtered = participants.filter(p => {

    const text = `${p.name} ${p.instagram}`.toLowerCase()
    return text.includes(search.toLowerCase())

  })

  return (

    <div className="max-w-5xl mx-auto p-10">

      <Card className="shadow-lg">

        <CardHeader className="flex flex-col gap-4">

          <CardTitle className="text-2xl">
            Panel de participantes
          </CardTitle>

          <Input
            placeholder="Buscar por nombre o instagram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

        </CardHeader>

        <CardContent>

          <div className="space-y-3">

            {filtered.map(p => (

  <motion.div
    key={p.id}
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="flex justify-between items-center border rounded-xl p-4 hover:bg-gray-50 transition shadow-sm"
  >

    <div className="flex flex-col">

      <div className="font-semibold text-lg">
        {p.name}
      </div>

      <div className="text-sm text-gray-500">
        @{p.instagram}
      </div>

    </div>

    <div className="flex items-center gap-6">

      <motion.div
        key={p.points}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-md"
      >
        {p.points} pts
      </motion.div>

      <div className="flex gap-2">

        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
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

  </motion.div>

))}{filtered.map(p => (

  <motion.div
    key={p.id}
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="flex justify-between items-center border rounded-xl p-4 hover:bg-gray-50 transition shadow-sm"
  >

    <div className="flex flex-col">

      <div className="font-semibold text-lg">
        {p.name}
      </div>

      <div className="text-sm text-gray-500">
        @{p.instagram}
      </div>

    </div>

    <div className="flex items-center gap-6">

      <motion.div
        key={p.points}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-md"
      >
        {p.points} pts
      </motion.div>

      <div className="flex gap-2">

        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
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

  </motion.div>

))}

          </div>

          {filtered.length === 0 && (

            <div className="text-center text-gray-400 py-12">
              No hay participantes
            </div>

          )}

        </CardContent>

      </Card>

    </div>

  )
}