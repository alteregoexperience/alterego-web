"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CrearParticipantePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createParticipant = async () => {
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/participants/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, instagram }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/gestion/participantes");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-xl mx-auto p-4 md:p-10">
        <Card className="bg-zinc-900 border border-zinc-800 shadow-xl">
          <CardHeader className="space-y-3">
            <Button
              variant="ghost"
              className="w-fit text-zinc-400 hover:text-white hover:bg-zinc-800 px-2 flex items-center gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft size={16} />
              Volver
            </Button>

            <CardTitle className="text-xl text-purple-400">
              Crear participante
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              autoFocus
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
            />

            <Input
              placeholder="Instagram (opcional)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
            />

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <Button
              onClick={createParticipant}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Crear participante
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
