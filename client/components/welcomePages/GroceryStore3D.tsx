"use client"

import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  ContactShadows,
  Environment,
  Float,
  Instance,
  Instances,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useCursor,
} from "@react-three/drei"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"

/* ------------------------------------------------------------------ */
/*  CONFIG                                                             */
/* ------------------------------------------------------------------ */
const BRAND = "INDO SWALAYAN"
const PARK_X = 1.9 // posisi parkir truk

type V3 = [number, number, number]

const C = {
  orange: "#f26a10",
  navy: "#16233f",
  road: "#4b5160",
  walk: "#cfd3d9",
  ground: "#a9b9a9",
  green: "#4f9a58",
  green2: "#63b06b",
  houseA: "#7a98d6",
  houseB: "#93aedd",
  roofA: "#3d5a96",
  roofB: "#4a6aa6",
}

const PALETTE = [
  "#e95c4b",
  "#f5c34d",
  "#6baf5d",
  "#4da3e0",
  "#f08fb0",
  "#ffffff",
  "#e5a04b",
  "#8e6fd8",
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/* ------------------------------------------------------------------ */
/*  TEXTURES (halus / HD)                                              */
/* ------------------------------------------------------------------ */
function makeTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d")!
  draw(g, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

function drawTile(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#f7f6f1"
  g.fillRect(0, 0, w, h)
  g.fillStyle = "#fff"
  g.fillRect(0, 0, w, 3)
  g.fillRect(0, 0, 3, h)
  g.fillStyle = "#d8d7cf"
  g.fillRect(0, h - 3, w, 3)
  g.fillRect(w - 3, 0, 3, h)
}

function useTextures() {
  return useMemo(() => {
    const sign = makeTexture(1024, 114, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, "#ff8a3d")
      grad.addColorStop(0.15, C.orange)
      grad.addColorStop(1, "#d9560a")
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
      g.fillStyle = "rgba(120,40,0,0.35)"
      for (let x = 128; x < w; x += 128) g.fillRect(x - 1, 0, 3, h)
      g.fillStyle = "#ffffff"
      g.font = "800 72px Arial, Helvetica, sans-serif"
      g.textAlign = "center"
      g.textBaseline = "middle"
      ;(g as unknown as { letterSpacing: string }).letterSpacing = "8px"
      g.shadowColor = "rgba(120,40,0,0.45)"
      g.shadowBlur = 6
      g.shadowOffsetY = 3
      g.fillText(BRAND, w / 2, h / 2 + 4)
    })

    const tileBack = makeTexture(128, 128, drawTile, [18, 8.4])
    const tileSide = makeTexture(128, 128, drawTile, [9, 8.4])
    const tileAnnex = makeTexture(128, 128, drawTile, [4.2, 5.7])

    const building = makeTexture(256, 640, (g, w, h) => {
      const r = rng(11)
      g.fillStyle = "#6f8fc0"
      g.fillRect(0, 0, w, h)
      for (let y = 30; y < h - 30; y += 52) {
        for (let x = 24; x < w - 24; x += 58) {
          g.fillStyle = r() > 0.35 ? "#d7e8fb" : "#4b6a9c"
          g.fillRect(x, y, 34, 30)
        }
      }
    })

    return { sign, tileBack, tileSide, tileAnnex, building }
  }, [])
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
function B({
  p,
  s,
  c = "#ffffff",
  map,
  rot,
  r = 0.035,
  rough = 0.65,
  metal = 0,
  emissive,
  ei = 1,
  shadow = true,
  opacity,
}: {
  p: V3
  s: V3
  c?: string
  map?: THREE.Texture
  rot?: V3
  r?: number
  rough?: number
  metal?: number
  emissive?: string
  ei?: number
  shadow?: boolean
  opacity?: number
}) {
  const mat = (
    <meshStandardMaterial
      color={c}
      map={map}
      roughness={rough}
      metalness={metal}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={ei}
      transparent={opacity !== undefined}
      opacity={opacity ?? 1}
    />
  )
  const small = Math.min(...s)
  if (map || small < 0.09) {
    return (
      <mesh position={p} rotation={rot} castShadow={shadow} receiveShadow>
        <boxGeometry args={s} />
        {mat}
      </mesh>
    )
  }
  return (
    <RoundedBox
      args={s}
      radius={Math.min(r, small / 2.2)}
      smoothness={3}
      position={p}
      rotation={rot}
      castShadow={shadow}
      receiveShadow
    >
      {mat}
    </RoundedBox>
  )
}

function Glass({ p, s, opacity = 0.22 }: { p: V3; s: V3; opacity?: number }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshPhysicalMaterial
        color="#bfe4ff"
        transparent
        opacity={opacity}
        roughness={0.05}
        metalness={0.1}
        envMapIntensity={1.6}
        depthWrite={false}
      />
    </mesh>
  )
}

function Wire({
  x1,
  y1,
  z1,
  x2,
  y2,
  z2,
  sag,
}: {
  x1: number
  y1: number
  z1: number
  x2: number
  y2: number
  z2: number
  sag: number
}) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(
        new THREE.Vector3(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t - sag * 4 * t * (1 - t),
          z1 + (z2 - z1) * t
        )
      )
    }
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts),
      48,
      0.012,
      6,
      false
    )
  }, [x1, y1, z1, x2, y2, z2, sag])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#1b2a4a" roughness={0.6} />
    </mesh>
  )
}

function Pole({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 6, 16]} />
        <meshStandardMaterial color="#a2a8b0" roughness={0.8} />
      </mesh>
      <B p={[0, 5.6, 0]} s={[1.5, 0.09, 0.09]} c="#8a9098" />
      <B p={[0, 5.1, 0]} s={[1.0, 0.09, 0.09]} c="#8a9098" />
      <B p={[0, 4.6, 0]} s={[0.7, 0.08, 0.08]} c="#8a9098" />
      {[-0.65, 0, 0.65].map((o) => (
        <B
          key={o}
          p={[o, 5.7, 0]}
          s={[0.1, 0.12, 0.1]}
          c="#e4e7ea"
          rough={0.2}
        />
      ))}
      {[-0.4, 0.4].map((o) => (
        <B
          key={o}
          p={[o, 5.2, 0]}
          s={[0.1, 0.12, 0.1]}
          c="#e4e7ea"
          rough={0.2}
        />
      ))}
      <mesh position={[0.3, 4.0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.55, 20]} />
        <meshStandardMaterial color="#8d949c" roughness={0.5} metalness={0.3} />
      </mesh>
      <B p={[0, 1.2, 0.1]} s={[0.1, 0.6, 0.04]} c="#e8c32a" />
    </group>
  )
}

function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.6, 10]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={C.green} roughness={0.85} />
      </mesh>
      <mesh position={[0.25, 1.15, 0.1]} castShadow>
        <sphereGeometry args={[0.36, 24, 24]} />
        <meshStandardMaterial color={C.green2} roughness={0.85} />
      </mesh>
    </group>
  )
}

function Bush({ p, s = 1, c = C.green }: { p: V3; s?: number; c?: string }) {
  return (
    <mesh position={p} scale={[s, s * 0.8, s]} castShadow receiveShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color={c} roughness={0.85} />
    </mesh>
  )
}

function House({
  p,
  s,
  body,
  roof,
  rh = 1.1,
}: {
  p: V3
  s: V3
  body: string
  roof: string
  rh?: number
}) {
  const [w, h, d] = s
  const shape = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-d / 2 - 0.14, 0)
    sh.lineTo(d / 2 + 0.14, 0)
    sh.lineTo(0, rh)
    sh.closePath()
    return sh
  }, [d, rh])
  const depth = w + 0.3
  return (
    <group position={p}>
      <B p={[0, h / 2, 0]} s={s} c={body} />
      <mesh
        position={[-depth / 2, h, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[shape, { depth, bevelEnabled: false }]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      {[-w / 4, w / 4].map((x) => (
        <group key={x} position={[x, h * 0.58, d / 2]}>
          <B p={[0, 0, 0.01]} s={[0.62, 0.7, 0.04]} c="#ffffff" />
          <B
            p={[0, 0, 0.04]}
            s={[0.5, 0.58, 0.03]}
            c="#bfe0ff"
            rough={0.1}
            emissive="#6aa8e0"
            ei={0.2}
          />
        </group>
      ))}
      <B p={[0, 0.5, d / 2 + 0.02]} s={[0.5, 1.0, 0.05]} c="#5b4a3a" />
    </group>
  )
}

function Cloud({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <Float speed={0.8} floatIntensity={0.8} rotationIntensity={0}>
      <group position={p} scale={s}>
        {(
          [
            [0, 0, 0, 0.5],
            [0.55, -0.05, 0.05, 0.4],
            [-0.55, -0.08, 0, 0.38],
            [0.2, 0.3, 0, 0.38],
          ] as [number, number, number, number][]
        ).map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1.2, 0.8, 1]}>
            <sphereGeometry args={[r, 20, 20]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.35}
              roughness={1}
            />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

/* ------------------------------------------------------------------ */
/*  KONBINI                                                            */
/* ------------------------------------------------------------------ */
function ACUnit({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <B p={[0, 0, 0]} s={[1.0, 0.85, 0.5]} c="#dcdfe3" />
      <mesh position={[0, 0, 0.255]}>
        <circleGeometry args={[0.32, 40]} />
        <meshStandardMaterial color="#2b2e34" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.26]}>
        <ringGeometry args={[0.3, 0.34, 40]} />
        <meshStandardMaterial color="#9ba1a9" roughness={0.4} metalness={0.4} />
      </mesh>
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
        <B
          key={a}
          p={[0, 0, 0.27]}
          s={[0.56, 0.05, 0.01]}
          rot={[0, 0, a]}
          c="#7f858d"
          shadow={false}
        />
      ))}
      <mesh position={[0, 0, 0.275]}>
        <circleGeometry args={[0.06, 20]} />
        <meshStandardMaterial color="#e8eaed" />
      </mesh>
    </group>
  )
}

function SlatUnit({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <B p={[0, 0, 0]} s={[0.7, 0.55, 0.4]} c="#dcdfe3" />
      {[-0.18, -0.06, 0.06, 0.18].map((y) => (
        <B
          key={y}
          p={[0, y, 0.205]}
          s={[0.55, 0.03, 0.02]}
          c="#555a62"
          shadow={false}
        />
      ))}
    </group>
  )
}

function Doors() {
  const l = useRef<THREE.Group>(null!)
  const r = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const k = THREE.MathUtils.smoothstep(
      Math.sin(clock.elapsedTime * 0.8),
      -0.2,
      0.4
    )
    l.current.position.x = -0.34 - k * 0.66
    r.current.position.x = 0.34 + k * 0.66
  })
  const panel = (side: 1 | -1) => (
    <>
      <Glass p={[0, 0, 0]} s={[0.68, 1.66, 0.03]} opacity={0.3} />
      <B p={[0, 0.83, 0]} s={[0.7, 0.06, 0.05]} c="#e6e9ee" />
      <B p={[0, -0.83, 0]} s={[0.7, 0.06, 0.05]} c="#e6e9ee" />
      <B p={[-0.34, 0, 0]} s={[0.04, 1.66, 0.05]} c="#e6e9ee" />
      <B p={[0.34, 0, 0]} s={[0.04, 1.66, 0.05]} c="#e6e9ee" />
      <B
        p={[0, -0.2, 0.025]}
        s={[0.68, 0.05, 0.01]}
        c={C.orange}
        shadow={false}
      />
      <B
        p={[side * 0.28, 0, 0.04]}
        s={[0.025, 0.28, 0.025]}
        c="#aab0b8"
        metal={0.7}
        rough={0.3}
      />
    </>
  )
  return (
    <group position={[0, 1.35, 1.56]}>
      <group ref={l} position={[-0.34, 0, 0]}>
        {panel(1)}
      </group>
      <group ref={r} position={[0.34, 0, 0.05]}>
        {panel(-1)}
      </group>
    </group>
  )
}

function Konbini() {
  const tx = useTextures()

  // semua produk (di-instancing biar ringan)
  const products = useMemo(() => {
    const r = rng(42)
    const list: { p: V3; s: V3; c: string }[] = []
    const pick = () => PALETTE[Math.floor(r() * PALETTE.length)]

    // kulkas minuman di dinding belakang
    for (const fx of [-1.8, 0, 1.8])
      for (const y of [0.62, 1.02, 1.42, 1.82])
        for (let i = 0; i < 8; i++) {
          const h = 0.2 + r() * 0.1
          list.push({
            p: [fx - 0.58 + i * 0.165, y - 0.17 + h / 2, -0.7],
            s: [0.09, h, 0.09],
            c: pick(),
          })
        }

    // rak tengah
    for (const ux of [-1.8, 1.8])
      for (const by of [0.42, 0.82, 1.22])
        for (const zo of [0.13, -0.13])
          for (let i = 0; i < 8; i++) {
            const h = 0.13 + r() * 0.12
            list.push({
              p: [ux - 0.7 + i * 0.2, 0.13 + by + 0.02 + h / 2, 0.15 + zo],
              s: [0.14, h, 0.12],
              c: pick(),
            })
          }

    // vending machine
    for (let row = 0; row < 5; row++)
      for (let i = 0; i < 4; i++)
        list.push({
          p: [3.75 - 0.25 + i * 0.17, 0.55 + row * 0.22, 1.3],
          s: [0.1, 0.16, 0.06],
          c: pick(),
        })

    return list
  }, [])

  return (
    <group>
      {/* plinth */}
      <B p={[0, 0.06, 0]} s={[6.3, 0.12, 3.3]} c="#d9dce0" />
      {/* lantai dalam */}
      <B p={[0, 0.125, 0]} s={[5.8, 0.03, 2.8]} c="#ece8dc" rough={0.35} />

      {/* dinding belakang & samping (tile putih) */}
      <mesh position={[0, 1.52, -1.425]} castShadow receiveShadow>
        <boxGeometry args={[6, 2.8, 0.15]} />
        <meshStandardMaterial map={tx.tileBack} roughness={0.5} />
      </mesh>
      {[-2.925, 2.925].map((x) => (
        <mesh key={x} position={[x, 1.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 2.8, 3]} />
          <meshStandardMaterial map={tx.tileSide} roughness={0.5} />
        </mesh>
      ))}

      {/* atap */}
      <B p={[0, 3.02, 0]} s={[6.3, 0.2, 3.3]} c="#f7f7f3" />

      {/* papan nama */}
      <mesh position={[0, 2.57, 1.58]} castShadow receiveShadow>
        <boxGeometry args={[6.3, 0.7, 0.28]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color={i === 4 ? "#ffffff" : C.orange}
            map={i === 4 ? tx.sign : null}
            roughness={0.45}
          />
        ))}
      </mesh>
      {[-3.01, 3.01].map((x) => (
        <B
          key={x}
          p={[x, 2.57, 0]}
          s={[0.28, 0.7, 3.0]}
          c={C.orange}
          rough={0.45}
        />
      ))}
      <B p={[0, 2.57, -1.58]} s={[6.3, 0.7, 0.28]} c={C.orange} rough={0.45} />

      {/* etalase kaca */}
      <Glass p={[0, 1.35, 1.5]} s={[5.4, 1.7, 0.04]} />
      <B p={[0, 0.31, 1.5]} s={[5.4, 0.38, 0.1]} c="#8e949c" />
      <B p={[0, 2.2, 1.52]} s={[5.5, 0.06, 0.08]} c="#e6e9ee" />
      <B p={[0, 0.5, 1.52]} s={[5.5, 0.06, 0.08]} c="#e6e9ee" />
      {[-2.7, -1.4, 1.4, 2.7].map((x) => (
        <B key={x} p={[x, 1.35, 1.52]} s={[0.06, 1.7, 0.08]} c="#e6e9ee" />
      ))}
      {[-2.85, 2.85].map((x) => (
        <B key={x} p={[x, 1.52, 1.45]} s={[0.3, 2.8, 0.2]} c="#f4f3ee" />
      ))}
      <Doors />

      {/* interior: lampu + cahaya */}
      {[-1.8, 0, 1.8].map((x) => (
        <B
          key={x}
          p={[x, 2.9, 0.2]}
          s={[1.4, 0.03, 0.22]}
          c="#ffffff"
          emissive="#ffffff"
          ei={2.2}
          shadow={false}
        />
      ))}
      <pointLight
        position={[0, 2.4, 0.2]}
        intensity={7}
        distance={7}
        decay={2}
        color="#fff3dc"
      />

      {/* kulkas minuman */}
      {[-1.8, 0, 1.8].map((x) => (
        <group key={x}>
          <B p={[x, 1.08, -1.05]} s={[1.6, 1.9, 0.6]} c="#eef1f4" />
          <B
            p={[x, 1.1, -0.745]}
            s={[1.45, 1.72, 0.03]}
            c="#dff3ff"
            emissive="#bfe8ff"
            ei={0.7}
            shadow={false}
          />
        </group>
      ))}

      {/* rak tengah */}
      {[-1.8, 1.8].map((x) => (
        <group key={x} position={[x, 0.13, 0.15]}>
          <B p={[0, 0.06, 0]} s={[1.6, 0.12, 0.5]} c="#c9ccd2" />
          <B p={[0, 0.7, 0]} s={[1.6, 1.4, 0.05]} c="#e4e6ea" />
          {[0.42, 0.82, 1.22].map((y) => (
            <B key={y} p={[0, y, 0]} s={[1.6, 0.04, 0.46]} c="#aeb4be" />
          ))}
        </group>
      ))}

      {/* kasir */}
      <B p={[2.0, 0.58, 1.0]} s={[1.3, 0.9, 0.5]} c="#b88a5a" rough={0.5} />
      <B p={[2.0, 1.08, 1.0]} s={[1.34, 0.08, 0.54]} c="#f2f2f2" />
      <B p={[1.8, 1.26, 1.0]} s={[0.35, 0.26, 0.28]} c="#2b2f38" />

      {/* semua produk (instancing) */}
      <Instances limit={800} castShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.45} />
        {products.map((pr, i) => (
          <Instance key={i} position={pr.p} scale={pr.s} color={pr.c} />
        ))}
      </Instances>

      {/* AC di atap */}
      <ACUnit p={[-0.8, 3.55, 0.1]} />
      <SlatUnit p={[0.6, 3.4, 0.1]} />
      <mesh position={[1.7, 3.35, -0.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial
          color="#aeb4be"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>

      {/* annex kiri */}
      <mesh position={[-3.85, 0.95, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.9, 2.0]} />
        <meshStandardMaterial map={tx.tileAnnex} roughness={0.5} />
      </mesh>
      <B p={[-3.85, 1.96, 0.5]} s={[1.5, 0.12, 2.1]} c="#f7f7f3" />
      <B p={[-3.85, 0.8, 1.52]} s={[0.65, 1.4, 0.05]} c="#2b3345" />
      <B
        p={[-3.65, 0.8, 1.56]}
        s={[0.04, 0.22, 0.04]}
        c="#cfd3d9"
        metal={0.7}
      />
      <SlatUnit p={[-4.57, 1.2, 0.5]} />

      {/* pipa belakang + pintu belakang */}
      <mesh position={[-2.7, 1.5, -1.6]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 3, 12]} />
        <meshStandardMaterial color="#aeb4be" metalness={0.4} roughness={0.4} />
      </mesh>
      <B p={[1.5, 0.98, -1.53]} s={[0.8, 1.7, 0.06]} c="#9aa0a8" />
      <B
        p={[1.5, 2.1, -1.57]}
        s={[0.4, 0.15, 0.1]}
        c="#fff7d0"
        emissive="#ffe9a0"
        ei={1}
      />

      {/* tempat sampah */}
      <B p={[-3.3, 0.46, 2.1]} s={[0.4, 0.72, 0.4]} c="#2d6fd6" />
      <B p={[-3.3, 0.85, 2.1]} s={[0.45, 0.07, 0.45]} c="#1f56ad" />
      <B p={[-2.82, 0.46, 2.1]} s={[0.4, 0.72, 0.4]} c="#9aa0a8" />
      <B p={[-2.82, 0.85, 2.1]} s={[0.45, 0.07, 0.45]} c="#767c85" />

      {/* traffic cone */}
      <group position={[-4.9, 0.1, 2.5]}>
        <B p={[0, 0.03, 0]} s={[0.42, 0.06, 0.42]} c={C.orange} />
        <mesh position={[0, 0.31, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.17, 0.5, 20]} />
          <meshStandardMaterial color={C.orange} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.085, 0.1, 0.1, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </group>

      {/* vending machine */}
      <B p={[3.75, 0.88, 0.9]} s={[0.85, 1.75, 0.75]} c="#d93a3a" rough={0.4} />
      <B
        p={[3.75, 1.0, 1.28]}
        s={[0.68, 1.25, 0.03]}
        c="#eaf6ff"
        emissive="#cfeaff"
        ei={0.8}
        shadow={false}
      />
      <B p={[3.75, 0.18, 1.28]} s={[0.5, 0.14, 0.03]} c="#222" shadow={false} />

      {/* papan A-frame */}
      <B
        p={[1.4, 0.52, 2.32]}
        s={[0.55, 0.85, 0.04]}
        c="#ffffff"
        rot={[0.22, 0, 0]}
      />
      <B
        p={[1.4, 0.52, 2.48]}
        s={[0.55, 0.85, 0.04]}
        c="#ffffff"
        rot={[-0.22, 0, 0]}
      />
      <B
        p={[1.4, 0.7, 2.28]}
        s={[0.45, 0.22, 0.02]}
        c={C.orange}
        rot={[0.22, 0, 0]}
        shadow={false}
      />

      {/* pot tanaman */}
      <mesh position={[2.95, 0.3, 2.15]} castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.4, 24]} />
        <meshStandardMaterial color="#d98c64" roughness={0.8} />
      </mesh>
      <Bush p={[2.95, 0.7, 2.15]} s={0.6} c={C.green2} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  TRUCK (klik untuk jalan!)                                          */
/* ------------------------------------------------------------------ */
function Wheel({ p, reg }: { p: V3; reg: (g: THREE.Group | null) => void }) {
  return (
    <group position={p} ref={reg}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.27, 0.2, 24]} />
        <meshStandardMaterial color="#1c1e22" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.22, 16]} />
        <meshStandardMaterial color="#c4c8ce" metalness={0.7} roughness={0.3} />
      </mesh>
      <B
        p={[0.08, 0, 0.115]}
        s={[0.12, 0.03, 0.01]}
        c="#555a62"
        shadow={false}
      />
    </group>
  )
}

function Truck() {
  const root = useRef<THREE.Group>(null!)
  const wheels = useRef<THREE.Group[]>([])
  const phase = useRef<"parked" | "leaving" | "arriving">("parked")
  const [hover, setHover] = useState(false)
  useCursor(hover)

  useFrame((_, dt) => {
    if (phase.current === "parked") return
    const g = root.current
    const v = 4 * Math.min(dt, 0.05)
    g.position.x -= v
    wheels.current.forEach((w) => w && (w.rotation.z += v / 0.27))
    if (phase.current === "leaving" && g.position.x < -9.5) {
      g.position.x = 9.5
      phase.current = "arriving"
    } else if (phase.current === "arriving" && g.position.x <= PARK_X) {
      g.position.x = PARK_X
      phase.current = "parked"
    }
  })

  const reg = (i: number) => (g: THREE.Group | null) => {
    if (g) wheels.current[i] = g
  }

  return (
    <group
      ref={root}
      position={[PARK_X, 0.04, 4.15]}
      onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation()
        if (phase.current === "parked") phase.current = "leaving"
      }}
    >
      <B p={[0, 0.4, 0]} s={[2.8, 0.14, 1.0]} c="#4d5158" />
      {/* kabin */}
      <B p={[-0.85, 0.92, 0]} s={[0.95, 0.88, 1.08]} c="#f2f2ee" r={0.1} />
      <B p={[-0.85, 1.36, 0]} s={[0.9, 0.06, 1.05]} c="#e1e2de" />
      <Glass p={[-1.335, 1.02, 0]} s={[0.03, 0.42, 0.9]} opacity={0.65} />
      <Glass p={[-0.85, 1.05, 0.555]} s={[0.62, 0.36, 0.03]} opacity={0.65} />
      <Glass p={[-0.85, 1.05, -0.555]} s={[0.62, 0.36, 0.03]} opacity={0.65} />
      <B p={[-1.37, 0.58, 0]} s={[0.1, 0.18, 1.12]} c="#7c8088" />
      <B
        p={[-1.36, 0.72, 0.38]}
        s={[0.04, 0.12, 0.16]}
        c="#fff6cc"
        emissive="#ffe9a0"
        ei={1.2}
        shadow={false}
      />
      <B
        p={[-1.36, 0.72, -0.38]}
        s={[0.04, 0.12, 0.16]}
        c="#fff6cc"
        emissive="#ffe9a0"
        ei={1.2}
        shadow={false}
      />
      {/* bak */}
      <B p={[0.55, 0.52, 0]} s={[1.65, 0.1, 1.08]} c="#8b9099" />
      <B p={[0.55, 0.7, 0.53]} s={[1.65, 0.26, 0.05]} c="#e8e9e6" />
      <B p={[0.55, 0.7, -0.53]} s={[1.65, 0.26, 0.05]} c="#e8e9e6" />
      <B p={[1.37, 0.7, 0]} s={[0.05, 0.26, 1.08]} c="#e8e9e6" />
      {/* muatan */}
      <B p={[0.25, 0.8, 0.0]} s={[0.55, 0.38, 0.6]} c="#c99a64" rough={0.8} />
      <B p={[0.9, 0.76, 0.1]} s={[0.5, 0.3, 0.5]} c="#d8aa74" rough={0.8} />
      <Wheel p={[-0.85, 0.27, 0.52]} reg={reg(0)} />
      <Wheel p={[-0.85, 0.27, -0.52]} reg={reg(1)} />
      <Wheel p={[0.85, 0.27, 0.52]} reg={reg(2)} />
      <Wheel p={[0.85, 0.27, -0.52]} reg={reg(3)} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  DIORAMA                                                            */
/* ------------------------------------------------------------------ */
function Ground() {
  return (
    <group>
      <B
        p={[0, -0.3, 0.5]}
        s={[14.4, 0.6, 10]}
        c="#2b3544"
        r={0.2}
        rough={0.5}
      />
      <B p={[0, 0.01, -1.5]} s={[14, 0.02, 6]} c={C.ground} rough={0.9} />
      <B p={[0, 0.05, 2.25]} s={[14, 0.1, 1.5]} c={C.walk} rough={0.8} />
      <B p={[0, 0.07, 3.03]} s={[14, 0.14, 0.07]} c="#9da2aa" />
      <B p={[0, 0.02, 4.25]} s={[14, 0.04, 2.5]} c={C.road} rough={0.9} />
      {Array.from({ length: 8 }).map((_, i) => (
        <B
          key={i}
          p={[-6.3 + i * 1.8, 0.045, 4.95]}
          s={[1.1, 0.01, 0.1]}
          c="#e9ecef"
          shadow={false}
        />
      ))}
    </group>
  )
}

function Background() {
  const tx = useTextures()
  return (
    <group>
      <House
        p={[-5.3, 0, -1.6]}
        s={[2.4, 2.3, 2.4]}
        body={C.houseA}
        roof={C.roofA}
      />
      <House
        p={[5.1, 0, -2]}
        s={[2.4, 2.1, 2.4]}
        body={C.houseB}
        roof={C.roofB}
        rh={1.0}
      />
      <House
        p={[-1.9, 0, -3.3]}
        s={[2.2, 1.8, 1.6]}
        body="#86a2d8"
        roof="#40609b"
        rh={0.9}
      />

      <mesh position={[2.5, 2.3, -3.6]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 4.6, 1.3]} />
        <meshStandardMaterial map={tx.building} roughness={0.7} />
      </mesh>
      <B p={[3.8, 1.5, -3.6]} s={[1.0, 3.0, 1.0]} c="#5f7fb3" />

      <Tree p={[-6.2, 0, 0.3]} s={1.1} />
      <Tree p={[6.2, 0, 0.8]} s={1.0} />
      <Tree p={[0.2, 0, -4.0]} s={1.2} />
      <Bush p={[4.6, 0.3, 0.2]} s={1.0} />
      <Bush p={[3.9, 0.22, -0.1]} s={0.7} c={C.green2} />
      <Bush p={[-5.5, 0.28, 1.0]} s={0.9} />
      <B p={[5.0, 0.3, 1.3]} s={[1.8, 0.6, 0.3]} c="#9aa0a8" />
    </group>
  )
}

function Wires() {
  const a = 5.6
  const b = -6.3
  const z = 2.3
  const rows = [
    { h: 5.7, o: -0.65, sag: 0.6 },
    { h: 5.7, o: 0, sag: 0.5 },
    { h: 5.7, o: 0.65, sag: 0.65 },
    { h: 5.2, o: -0.4, sag: 0.45 },
    { h: 5.2, o: 0.4, sag: 0.55 },
  ]
  return (
    <group>
      <Pole x={a} z={z} />
      <Pole x={b} z={z} />
      {rows.map((w, i) => (
        <Wire
          key={i}
          x1={a + w.o}
          y1={w.h}
          z1={z}
          x2={b + w.o}
          y2={w.h}
          z2={z}
          sag={w.sag}
        />
      ))}
    </group>
  )
}

function Fit() {
  const { camera, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.zoom = Math.min(1.15, size.width / size.height / 1.45)
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

/* ------------------------------------------------------------------ */
/*  EXPORT                                                             */
/* ------------------------------------------------------------------ */
export default function GroceryStore3D() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null)
  const [auto, setAuto] = useState(false)

  return (
    <div
      className="relative h-[260px] w-full cursor-grab overflow-hidden rounded-3xl active:cursor-grabbing md:h-[400px]"
      style={{
        background:
          "linear-gradient(180deg,#5cb8e6 0%,#a8dcf3 70%,#d6effa 100%)",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.4, 17], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Fit />

          <ambientLight intensity={0.45} />
          <hemisphereLight args={["#cfeaff", "#8a9a8a", 0.5]} />
          <directionalLight
            position={[7, 11, 10]}
            intensity={2.6}
            color="#fff4e0"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-camera-far={45}
            shadow-bias={-0.0004}
            shadow-normalBias={0.03}
          />
          <directionalLight
            position={[-8, 5, 6]}
            intensity={0.6}
            color="#cfe4ff"
          />

          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={2.2}
              position={[0, 6, 6]}
              scale={[14, 5, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.2}
              position={[-8, 3, 2]}
              rotation-y={Math.PI / 2}
              scale={[8, 4, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.2}
              position={[8, 3, 2]}
              rotation-y={-Math.PI / 2}
              scale={[8, 4, 1]}
            />
          </Environment>

          <Float
            speed={1.1}
            rotationIntensity={0}
            floatIntensity={0.35}
            floatingRange={[-0.06, 0.06]}
          >
            <group>
              <Ground />
              <Konbini />
              <Background />
              <Wires />
              <Truck />
            </group>
          </Float>

          <Cloud p={[-5, 7.2, -2]} s={1.2} />
          <Cloud p={[4.6, 7.8, -3]} s={1.5} />
          <Cloud p={[-0.5, 8.8, -4]} s={0.9} />

          <ContactShadows
            position={[0, -0.75, 0.5]}
            opacity={0.35}
            scale={24}
            blur={2.8}
            far={3}
            color="#1d3a52"
          />

          <OrbitControls
            ref={controls}
            makeDefault
            target={[0, 1.8, 0.5]}
            enableDamping
            dampingFactor={0.07}
            rotateSpeed={0.9}
            minDistance={6}
            maxDistance={26}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.08}
            autoRotate={auto}
            autoRotateSpeed={1.4}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={() => setAuto((v) => !v)}
          className="rounded-full bg-white/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/40"
        >
          {auto ? "Stop putar" : "Auto putar"}
        </button>
        <button
          onClick={() => controls.current?.reset()}
          className="rounded-full bg-white/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/40"
        >
          Reset
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-3 left-1/2 w-max -translate-x-1/2 text-[11px] font-semibold tracking-widest text-white/90 uppercase drop-shadow">
        drag putar · klik kanan geser · scroll zoom · klik truk 🚚
      </p>
    </div>
  )
}
