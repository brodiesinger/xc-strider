import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CelebrationOverlay({ show, type, message, onDone }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background:
              type === "streak"
                ? "linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f97316 100%)"
                : "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #0891b2 100%)",
          }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4 px-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.15, 1] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-7xl"
            >
              {type === "streak" ? "🔥" : "🏅"}
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-extrabold text-white leading-tight drop-shadow-lg"
            >
              {message}
            </motion.p>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-sm font-medium"
            >
              {type === "streak" ? "Keep it up! 💪" : "Achievement unlocked!"}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}