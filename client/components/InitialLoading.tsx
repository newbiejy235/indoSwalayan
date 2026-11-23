"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

interface InitialLoadingProps {
  onComplete: () => void
}

export default function InitialLoading({ onComplete }: InitialLoadingProps) {
  const [phase, setPhase] = useState<"green" | "yellow" | "logo">("green")

  useEffect(() => {
    const yellowTimer = setTimeout(() => {
      setPhase("yellow")
    }, 1100)

    const logoTimer = setTimeout(() => {
      setPhase("logo")
    }, 2600)

    // Logo selesai muncul setelah transisi 1.1 detik.
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 3900)

    return () => {
      clearTimeout(yellowTimer)
      clearTimeout(logoTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  const ballAnimation = {
    initial: {
      y: -350,
      opacity: 0,
      scale: 0.7,
    },
    animate: {
      y: [-350, 0, -65, 0, -30, 0],
      opacity: [0, 1, 1, 1, 1, 1],
      scale: [0.7, 1, 1, 1, 1, 1],
      transition: {
        duration: 1.1,
        times: [0, 0.45, 0.65, 0.78, 0.9, 1],
        ease: "easeOut" as const,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      y: 30,
      transition: {
        duration: 0.35,
        ease: "easeIn" as const,
      },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8faf7]"
    >
      <div className="relative flex h-52 w-64 items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "green" && (
            <motion.div
              key="green"
              variants={ballAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute h-20 w-20 rounded-full bg-[#164b35] shadow-[0_15px_35px_rgba(22,75,53,0.2)]"
            />
          )}

          {phase === "yellow" && (
            <motion.div
              key="yellow"
              variants={ballAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute h-28 w-28 rounded-full bg-[#facc15] shadow-[0_15px_35px_rgba(250,204,21,0.25)]"
            />
          )}

          {phase === "logo" && (
            <motion.div
              key="logo"
              initial={{
                clipPath: "inset(0 100% 0 0)",
                opacity: 0,
              }}
              animate={{
                clipPath: "inset(0 0% 0 0)",
                opacity: 1,
              }}
              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Image
                src="/images/indoSwalayan2.png"
                alt="Indo Swalayan Logo"
                width={220}
                height={220}
                priority
                className="h-auto w-[220px] object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-5 text-sm font-medium tracking-[0.25em] text-[#164b35]/60">
        {phase === "logo" ? "WELCOME" : "LOADING"}
      </p>
    </motion.div>
  )
}
