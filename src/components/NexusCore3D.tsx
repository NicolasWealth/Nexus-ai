import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Wireframe Sphere ─────────────────────────────────────────────────────────
// Builds a custom LineSegments mesh from an IcosahedronGeometry so every
// triangular edge renders as a glowing emerald line — no surface fill.

function WireframeSphere() {
  const meshRef = useRef<THREE.LineSegments>(null)

  const geometry = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(1.6, 4)
    return new THREE.WireframeGeometry(base)
  }, [])

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#34d399').multiplyScalar(2),
        toneMapped: false,
        transparent: true,
        opacity: 0.85,
        linewidth: 1,
      }),
    []
  )

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.18
    meshRef.current.rotation.x += delta * 0.07
  })

  return <lineSegments ref={meshRef} geometry={geometry} material={material} />
}

// ─── Secondary Latitude / Longitude Ring Grid ─────────────────────────────────
// Adds extra horizontal rings that evoke a globe — layered on top of the
// icosahedron edges for visual density.

function RingGrid() {
  const ref = useRef<THREE.Group>(null)

  const rings = useMemo(() => {
    const groups: { points: THREE.Vector3[]; key: string }[] = []

    // Latitude rings
    const latCount = 8
    for (let i = 0; i < latCount; i++) {
      const phi = (Math.PI * i) / (latCount - 1)
      const radius = 1.62 * Math.sin(phi)
      const y = 1.62 * Math.cos(phi)
      const pts: THREE.Vector3[] = []
      const segments = 64
      for (let j = 0; j <= segments; j++) {
        const theta = (2 * Math.PI * j) / segments
        pts.push(new THREE.Vector3(radius * Math.cos(theta), y, radius * Math.sin(theta)))
      }
      groups.push({ points: pts, key: `lat-${i}` })
    }

    // Longitude arcs
    const lonCount = 10
    for (let i = 0; i < lonCount; i++) {
      const theta = (2 * Math.PI * i) / lonCount
      const pts: THREE.Vector3[] = []
      const segments = 64
      for (let j = 0; j <= segments; j++) {
        const phi = (Math.PI * j) / segments
        pts.push(
          new THREE.Vector3(
            1.62 * Math.sin(phi) * Math.cos(theta),
            1.62 * Math.cos(phi),
            1.62 * Math.sin(phi) * Math.sin(theta)
          )
        )
      }
      groups.push({ points: pts, key: `lon-${i}` })
    }

    return groups
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y -= delta * 0.09
    ref.current.rotation.z += delta * 0.04
  })

  return (
    <group ref={ref}>
      {rings.map(({ points, key }) => {
        const geo = new THREE.BufferGeometry().setFromPoints(points)
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color('#6ee7b7').multiplyScalar(1.5),
          toneMapped: false,
          transparent: true,
          opacity: 0.28,
        })
        return <primitive object={new THREE.Line(geo, mat)} key={key} />
      })}
    </group>
  )
}

// ─── Pulsing Core ─────────────────────────────────────────────────────────────
// A distorted solid sphere at the centre — emissive purple so Bloom
// makes it bleed light outward.

function PulsingCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (meshRef.current) {
      const scale = 0.88 + Math.sin(t * 2.4) * 0.12
      meshRef.current.scale.setScalar(scale)
    }

    if (materialRef.current) {
      // Pulse emissive intensity between dim and bright purple
      const intensity = 1.4 + Math.sin(t * 2.4) * 0.9
      materialRef.current.emissiveIntensity = intensity
      // Slowly shift distortion speed
      ;(materialRef.current as THREE.MeshStandardMaterial & { distort: number }).distort =
        0.35 + Math.sin(t * 0.8) * 0.15
    }
  })

  return (
    <Sphere ref={meshRef} args={[0.48, 64, 64]}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#7c3aed"
        emissive="#a855f7"
        emissiveIntensity={1.6}
        distort={0.38}
        speed={4}
        roughness={0.1}
        metalness={0.6}
        transparent
        opacity={0.95}
      />
    </Sphere>
  )
}

// ─── Inner Orbiting Sparks ────────────────────────────────────────────────────
// Three tiny bright points that orbit the core on tilted planes — they
// register as tiny light sources once Bloom processes the frame.

function OrbitingSparks() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.getElapsedTime() * 1.1
    groupRef.current.rotation.x = clock.getElapsedTime() * 0.6
  })

  const sparks = [
    { radius: 0.82, tilt: 0,    color: '#34d399', size: 0.045 },
    { radius: 0.92, tilt: 55,   color: '#c084fc', size: 0.035 },
    { radius: 0.76, tilt: -38,  color: '#e8ff00', size: 0.038 },
  ]

  return (
    <group ref={groupRef}>
      {sparks.map(({ radius, tilt, color, size }, i) => (
        <group key={i} rotation={[0, 0, (tilt * Math.PI) / 180]}>
          <mesh position={[radius, 0, 0]}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={4}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} color="#a855f7" intensity={3} distance={6} />
      <pointLight position={[3, 2, 2]} color="#34d399" intensity={1.2} distance={8} />

      {/* Whole assembly drifts with Float */}
      <Float
        speed={1.6}
        rotationIntensity={0.22}
        floatIntensity={0.55}
        floatingRange={[-0.18, 0.18]}
      >
        <WireframeSphere />
        <RingGrid />
        <PulsingCore />
        <OrbitingSparks />
      </Float>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.05}
          luminanceSmoothing={0.72}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

// ─── Public Component ─────────────────────────────────────────────────────────

interface NexusCore3DProps {
  /** Container width  — defaults to 520px */
  width?: number | string
  /** Container height — defaults to 520px */
  height?: number | string
  /** Expose orbit controls for dev/demo use */
  orbitControls?: boolean
  className?: string
}

export function NexusCore3D({
  width = 520,
  height = 520,
  orbitControls = false,
  className = '',
}: NexusCore3DProps) {
  return (
    <div
      className={className}
      style={{ width, height, position: 'relative', pointerEvents: orbitControls ? 'auto' : 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 52, near: 0.1, far: 100 }}
        gl={{
          alpha: true,          // transparent canvas background
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Scene />
        {orbitControls && <OrbitControls enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  )
}

export default NexusCore3D
