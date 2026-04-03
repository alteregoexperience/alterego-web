"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function EventDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-40"
            onClick={onClose}
          />

          {/* PANEL */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-0 md:top-10 md:bottom-10 md:mx-auto md:max-w-5xl
            bg-black border border-white/10 rounded-t-3xl md:rounded-3xl
            z-50 overflow-y-auto"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
