"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"

type Participant = {
  id: string
  name: string
  instagram: string
  points: number
}

export default function RankingPage() {

  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {

    const fetchRanking = async () => {

      const { data } = await supabase
        .from("participants")
        .select("*")
        .order("points", { ascending: false })
        .limit(15)

      setParticipants(data ?? [])
    }

    fetchRanking()

    const channel = supabase
      .channel("ranking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
        },
        () => {
          fetchRanking()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [])

  return (

    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">

      <div className="max-w-4xl mx-auto p-10">

        <h1 className="text-4xl font-bold text-center mb-10">
          Ranking
        </h1>

        <div className="space-y-3">

          <AnimatePresence>

            {participants.map((p, index) => (

              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="flex justify-between items-center bg-gray-800 p-4 rounded-lg"
              >

                <div className="flex items-center gap-4">

                  <div className="text-gray-400 w-6 text-lg">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="font-medium text-lg">
                      {p.name}
                    </div>

                    <div className="text-gray-400 text-sm">
                      @{p.instagram}
                    </div>
                  </div>

                </div>

                <div className="text-yellow-400 font-semibold text-lg">
                  {p.points} pts
                </div>

              </motion.div>

            ))}

          </AnimatePresence>

        </div>

      </div>

    </div>
  )
}