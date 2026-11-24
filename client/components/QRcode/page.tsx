"use client"

import React, { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode"
import {
  Camera,
  CameraOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Scan,
} from "lucide-react"

const formatsToSupport = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
]

export type ScannerStatus =
  "IDLE" | "STARTING" | "SCANNING" | "SUCCESS" | "ERROR"

export interface Html5QrcodePluginProps {
  id?: string
  fps?: number
  qrbox?: number | { width: number; height: number }
  aspectRatio?: number
  qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void
  qrCodeErrorCallback?: (errorMessage: string) => void
  autoStart?: boolean
  className?: string
}

const Html5QrcodePlugin: React.FC<Html5QrcodePluginProps> = ({
  id,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  qrCodeSuccessCallback,
  qrCodeErrorCallback,
  autoStart = false,
  className = "",
}) => {
  const [status, setStatus] = useState<ScannerStatus>("IDLE")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [lastDecodedText, setLastDecodedText] = useState<string | null>(null)

  // Generate a stable container ID that is identical on SSR and client hydration
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const scannerId = id || `html5qr-code-${reactId}`
  const scannerIdRef = useRef<string>(scannerId)
  scannerIdRef.current = scannerId

  // Persistent references for scanner instance and lifecycle management
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const shouldScanRef = useRef<boolean>(false)
  const isStartingRef = useRef<boolean>(false)
  const startPromiseRef = useRef<Promise<null> | null>(null)
  const isScannedRef = useRef<boolean>(false)

  // Mutex promise queue to strictly serialize start and stop hardware operations
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current
      .then(async () => {
        await task()
      })
      .catch((err) => {
        console.warn("Scanner queue execution warning:", err)
      })
    return queueRef.current
  }, [])

  // Callback stability: keep callbacks in refs so changes don't trigger camera restarts
  const successCallbackRef = useRef(qrCodeSuccessCallback)
  const errorCallbackRef = useRef(qrCodeErrorCallback)
  useEffect(() => {
    successCallbackRef.current = qrCodeSuccessCallback
  })
  useEffect(() => {
    errorCallbackRef.current = qrCodeErrorCallback
  })

  // Safe asynchronous stop function
  const stopScannerInternal = useCallback(async () => {
    shouldScanRef.current = false

    // If start is currently in progress, wait for it to complete first
    if (isStartingRef.current && startPromiseRef.current) {
      try {
        await startPromiseRef.current
      } catch {
        // Start failed, continue cleanup
      }
    }

    const scanner = scannerRef.current
    if (scanner) {
      try {
        const state = scanner.getState()
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await scanner.stop()
        }
      } catch (err) {
        console.warn("Stop scanner error:", err)
      }

      try {
        scanner.clear()
      } catch (err) {
        console.warn("Clear scanner error:", err)
      }
    }

    if (isMountedRef.current) {
      setStatus("IDLE")
    }
  }, [])

  // Safe asynchronous start function
  const startScannerInternal = useCallback(async () => {
    if (!isMountedRef.current) return

    const container = document.getElementById(scannerId)
    if (!container) {
      console.warn("Scanner DOM container not found.")
      return
    }

    // Check if already scanning or starting
    if (scannerRef.current?.isScanning) {
      return
    }

    shouldScanRef.current = true
    isStartingRef.current = true
    isScannedRef.current = false
    setErrorMessage("")
    setStatus("STARTING")

    // Clear previous DOM children to prevent duplicate preview elements
    container.innerHTML = ""

    // Create or reuse single Html5Qrcode instance
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerId, {
        verbose: false,
        formatsToSupport
      })
    }

    const scanner = scannerRef.current

    try {
      const qrboxConfig =
        typeof qrbox === "number"
          ? (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
              const size = Math.min(
                qrbox,
                Math.max(50, Math.floor(minEdge * 0.8))
              )
              return { width: size, height: size }
            }
          : qrbox

      const startPromise = scanner.start(
        { facingMode: "environment" },
        {
          fps,
          qrbox: qrboxConfig,
          aspectRatio,
        },
        (decodedText, decodedResult) => {
          // Prevent multiple callbacks for the same QR code
          if (isScannedRef.current) return
          isScannedRef.current = true

          // Invoke parent success callback
          successCallbackRef.current?.(decodedText, decodedResult)

          if (isMountedRef.current) {
            setLastDecodedText(decodedText)
            setStatus("SUCCESS")
          }

          // Temporarily pause scanner to prevent continuous reading of the same code
          try {
            if (scanner.isScanning) {
              scanner.pause(true)
            }
          } catch (pauseErr) {
            console.warn("Pause scanner error:", pauseErr)
          }
        },
        (errorMessage) => {
          errorCallbackRef.current?.(errorMessage)
        }
      )

      startPromiseRef.current = startPromise
      await startPromise

      // If user stopped or component unmounted while start was in-flight
      if (!shouldScanRef.current || !isMountedRef.current) {
        try {
          if (scanner.isScanning) {
            await scanner.stop()
          }
          scanner.clear()
        } catch (stopErr) {
          console.warn("Cleanup after cancelled start error:", stopErr)
        }
        if (isMountedRef.current) setStatus("IDLE")
        return
      }

      if (isMountedRef.current) {
        setStatus("SCANNING")
      }
    } catch (err: any) {
      console.error("Gagal memulai scanner:", err)
      if (isMountedRef.current) {
        setStatus("ERROR")
        const errStr = String(err?.message || err)
        if (
          errStr.includes("NotAllowedError") ||
          errStr.includes("Permission") ||
          err?.name === "NotAllowedError"
        ) {
          setErrorMessage(
            "Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda."
          )
        } else if (
          errStr.includes("NotReadableError") ||
          errStr.includes("TrackStartError") ||
          err?.name === "NotReadableError"
        ) {
          setErrorMessage(
            "Kamera sedang digunakan oleh aplikasi lain atau sistem operasi."
          )
        } else if (
          errStr.includes("NotFoundError") ||
          errStr.includes("DevicesNotFoundError") ||
          err?.name === "NotFoundError"
        ) {
          setErrorMessage("Tidak ada kamera yang ditemukan pada perangkat ini.")
        } else {
          setErrorMessage(errStr || "Gagal mengakses kamera.")
        }
      }
    } finally {
      isStartingRef.current = false
      startPromiseRef.current = null
    }
  }, [fps, qrbox, aspectRatio, scannerId])

  // Public actions with serialized queue
  const handleStart = useCallback(() => {
    enqueue(startScannerInternal)
  }, [enqueue, startScannerInternal])

  const handleStop = useCallback(() => {
    enqueue(stopScannerInternal)
  }, [enqueue, stopScannerInternal])

  const handleRescan = useCallback(() => {
    enqueue(async () => {
      isScannedRef.current = false
      setLastDecodedText(null)

      const scanner = scannerRef.current
      if (scanner && scanner.getState() === Html5QrcodeScannerState.PAUSED) {
        try {
          scanner.resume()
          if (isMountedRef.current) {
            setStatus("SCANNING")
          }
          return
        } catch (err) {
          console.warn("Resume failed, restarting scanner:", err)
        }
      }

      await startScannerInternal()
    })
  }, [enqueue, startScannerInternal])

  // Lifecycle effect with async cleanup
  useEffect(() => {
    isMountedRef.current = true

    if (autoStart) {
      enqueue(startScannerInternal)
    }

    return () => {
      isMountedRef.current = false
      shouldScanRef.current = false

      enqueue(async () => {
        if (isStartingRef.current && startPromiseRef.current) {
          try {
            await startPromiseRef.current
          } catch {
            // ignore
          }
        }

        const scanner = scannerRef.current
        if (scanner) {
          try {
            const state = scanner.getState()
            if (
              state === Html5QrcodeScannerState.SCANNING ||
              state === Html5QrcodeScannerState.PAUSED
            ) {
              await scanner.stop()
            }
          } catch (err) {
            console.warn("Cleanup stop error:", err)
          }

          try {
            scanner.clear()
          } catch (err) {
            console.warn("Cleanup clear error:", err)
          }

          scannerRef.current = null
        }
      })
    }
  }, [autoStart, enqueue, startScannerInternal])

  return (
    <div
      className={`mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {/* Card Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Scan className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
              QR Code Scanner
            </h3>
            <p className="text-xs text-gray-500">
              Arahkan kamera ke QR Code produk
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {status === "IDLE" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Kamera Belum Aktif
            </span>
          )}
          {status === "STARTING" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              Menyiapkan Kamera...
            </span>
          )}
          {status === "SCANNING" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Kamera Sedang Aktif
            </span>
          )}
          {status === "SUCCESS" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              QR Code Berhasil Dibaca
            </span>
          )}
          {status === "ERROR" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              Kesalahan Kamera
            </span>
          )}
        </div>
      </div>

      {/* Scanner Viewport */}
      <div className="relative mx-auto mt-5 flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner sm:max-w-md">
        {/* Target DOM Element for Html5Qrcode with CSS overrides to ensure single video preview */}
        <div
          id={scannerId}
          className="relative h-full w-full overflow-hidden [&_canvas]:!hidden [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
        />

        {/* IDLE Overlay */}
        {status === "IDLE" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center text-white backdrop-blur-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Camera className="h-8 w-8 text-gray-300" />
            </div>
            <h4 className="text-base font-semibold text-gray-200">
              Kamera Tidak Aktif
            </h4>
            <p className="mt-1 max-w-xs text-xs text-gray-400">
              Tekan tombol Mulai Kamera untuk membuka scanner dan memindai QR
              Code produk.
            </p>
          </div>
        )}

        {/* STARTING Overlay */}
        {status === "STARTING" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center text-white backdrop-blur-sm">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-emerald-400" />
            <h4 className="text-base font-semibold text-gray-200">
              Menghubungkan ke Kamera...
            </h4>
            <p className="mt-1 max-w-xs text-xs text-gray-400">
              Mohon izinkan akses kamera jika browser meminta izin.
            </p>
          </div>
        )}

        {/* SCANNING Reticle / Viewfinder Frame */}
        {status === "SCANNING" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64">
              {/* 4 Corner Markers */}
              <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-4 border-l-4 border-emerald-400" />
              <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-4 border-r-4 border-emerald-400" />
              <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-emerald-400" />
              <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-r-4 border-b-4 border-emerald-400" />

              {/* Scanning line animation */}
              <div className="absolute top-1/2 right-2 left-2 h-0.5 animate-pulse bg-emerald-400/80 shadow-[0_0_8px_#34d399]" />
            </div>

            <div className="absolute right-0 bottom-4 left-0 text-center">
              <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                Posisikan QR Code di dalam kotak bidik
              </span>
            </div>
          </div>
        )}

        {/* SUCCESS Overlay */}
        {status === "SUCCESS" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/85 p-6 text-center text-white backdrop-blur-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h4 className="text-base font-semibold text-white">
              QR Code Terdeteksi!
            </h4>
            <p className="mt-1 text-xs text-emerald-200">
              Scanner dihentikan sementara agar tidak membaca berulang kali.
            </p>
            {lastDecodedText && (
              <div className="mt-3 max-w-[280px] truncate rounded-lg border border-emerald-500/20 bg-black/50 px-3 py-1.5 font-mono text-xs text-emerald-300">
                {lastDecodedText}
              </div>
            )}
          </div>
        )}

        {/* ERROR Overlay */}
        {status === "ERROR" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center text-white backdrop-blur-sm">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/20 text-red-400">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h4 className="text-base font-semibold text-red-200">
              Gagal Mengakses Kamera
            </h4>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-300">
              {errorMessage ||
                "Pastikan kamera terpasang dan izin akses telah diberikan."}
            </p>
          </div>
        )}
      </div>

      {/* Decoded Result Feedback Banner */}
      {lastDecodedText && status === "SUCCESS" && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              Hasil Pemindaian
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold break-all text-emerald-950 select-all">
              {lastDecodedText}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600">
              Hasil decoding berhasil ditampilkan pada console browser.
            </p>
          </div>
        </div>
      )}

      {/* Control Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {(status === "IDLE" || status === "ERROR") && (
          <button
            type="button"
            onClick={handleStart}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#15803d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 active:scale-95"
          >
            <Camera className="h-4 w-4" />
            Mulai Kamera
          </button>
        )}

        {status === "STARTING" && (
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Menghubungkan...
          </button>
        )}

        {status === "SCANNING" && (
          <button
            type="button"
            onClick={handleStop}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-95"
          >
            <CameraOff className="h-4 w-4" />
            Hentikan Kamera
          </button>
        )}

        {status === "SUCCESS" && (
          <>
            <button
              type="button"
              onClick={handleRescan}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#15803d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Scan Ulang
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 active:scale-95"
            >
              <CameraOff className="h-4 w-4" />
              Hentikan
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Html5QrcodePlugin
