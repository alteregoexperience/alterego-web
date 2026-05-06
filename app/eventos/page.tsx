import { Suspense } from "react";

import PublicBackground from "@/components/public/layout/PublicBackground";
import EventosClient from "./EventosClient";
import { getPublicEvents } from "@/lib/public/getUpcomingEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventosPage() {
  const events = await getPublicEvents();

  return (
    <PublicBackground>
      <Suspense fallback={null}>
        <EventosClient events={events} />
      </Suspense>
    </PublicBackground>
  );
}
