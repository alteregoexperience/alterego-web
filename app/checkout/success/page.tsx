// app/checkout/success/page.tsx

import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export const dynamic = "force-dynamic";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400 text-sm">Cargando confirmación...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
