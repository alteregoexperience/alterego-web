import { Suspense } from "react";

import PublicBackground from "@/components/public/layout/PublicBackground";
import HeroSection from "@/components/public/home/HeroSection";
import UpcomingEventsSection from "@/components/public/home/UpcomingEventsSection";
import HowItWorksSection from "@/components/public/home/HowItWorksSection";
import InfoSection from "@/components/public/home/InfoSection";

import { getUpcomingEvents } from "@/lib/public/getUpcomingEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const events = await getUpcomingEvents();

  return (
    <PublicBackground>
      <main className="flex flex-col gap-10">
        <HeroSection />

        <Suspense fallback={null}>
          <UpcomingEventsSection events={events} />
        </Suspense>

        <HowItWorksSection />
        <InfoSection />
      </main>
    </PublicBackground>
  );
}
