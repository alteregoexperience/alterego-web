import PublicBackground from "@/components/public/layout/PublicBackground";
import HeroSection from "@/components/public/home/HeroSection";
import UpcomingEventsSection from "@/components/public/home/UpcomingEventsSection";
import HowItWorksSection from "@/components/public/home/HowItWorksSection";
import InfoSection from "@/components/public/home/InfoSection";

import { getUpcomingEvents } from "@/lib/public/getUpcomingEvents";

export default async function Home() {
  const events = await getUpcomingEvents();

  return (
    <PublicBackground>
      <main className="flex flex-col gap-10">
        <HeroSection />
        <UpcomingEventsSection events={events} />
        <HowItWorksSection />
        <InfoSection />
      </main>
    </PublicBackground>
  );
}
