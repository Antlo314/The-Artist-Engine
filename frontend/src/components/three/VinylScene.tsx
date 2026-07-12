import { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------
   VinylScene — fully procedural 3D hero (no external models/HDRIs).
   A spinning obsidian record + an audio-reactive equalizer ring.
------------------------------------------------------------------- */

const BAR_COUNT = 84;
const RING_RADIUS = 3.35;
const EMBER = new THREE.Color('#dc2626');
const BONE = new THREE.Color('#f4f4f5');

/** Procedural groove texture: concentric rings drawn to a canvas. */
function useGrooveTexture() {
    return useMemo(() => {
        const size = 1024;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, size, size);
        const cx = size / 2;
        for (let r = 150; r < size / 2 - 8; r += 3) {
            const shade = 14 + Math.round(Math.random() * 26);
            ctx.strokeStyle = `rgb(${shade},${shade},${shade + 2})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(cx, cx, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 8;
        return tex;
    }, []);
}

function VinylDisc() {
    const disc = useRef<THREE.Group>(null!);
    const grooves = useGrooveTexture();

    useFrame((_, delta) => {
        // 33⅓ RPM feel — slow, hypnotic
        disc.current.rotation.y += delta * 0.55;
    });

    return (
        <group ref={disc}>
            {/* The record itself */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[2.25, 2.25, 0.055, 128]} />
                <meshStandardMaterial
                    color="#0a0a0b"
                    metalness={0.9}
                    roughness={0.32}
                    roughnessMap={grooves}
                    envMapIntensity={1.2}
                />
            </mesh>
            {/* Groove sheen overlay (top face) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.029, 0]}>
                <ringGeometry args={[0.78, 2.24, 128]} />
                <meshStandardMaterial
                    map={grooves}
                    color="#242428"
                    metalness={0.95}
                    roughness={0.25}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            {/* Center label */}
            <mesh position={[0, 0.006, 0]}>
                <cylinderGeometry args={[0.72, 0.72, 0.06, 64]} />
                <meshStandardMaterial color="#b91c1c" metalness={0.35} roughness={0.5} />
            </mesh>
            {/* Label ring detail */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.038, 0]}>
                <ringGeometry args={[0.6, 0.63, 64]} />
                <meshBasicMaterial color="#f4f4f5" transparent opacity={0.5} />
            </mesh>
            {/* Spindle hole */}
            <mesh position={[0, 0.01, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.08, 32]} />
                <meshStandardMaterial color="#060607" metalness={0.2} roughness={0.9} />
            </mesh>
        </group>
    );
}

/** Equalizer ring: BAR_COUNT instanced bars pulsing like a live spectrum. */
function EqualizerRing() {
    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const color = useMemo(() => new THREE.Color(), []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        for (let i = 0; i < BAR_COUNT; i++) {
            const angle = (i / BAR_COUNT) * Math.PI * 2;
            // Layered sines ≈ organic waveform motion
            const amp =
                0.18 +
                Math.abs(
                    Math.sin(t * 2.1 + i * 0.55) * 0.45 +
                    Math.sin(t * 3.7 + i * 0.21) * 0.28 +
                    Math.sin(t * 1.3 + i * 1.7) * 0.18
                );
            dummy.position.set(
                Math.cos(angle) * RING_RADIUS,
                amp / 2 - 0.35,
                Math.sin(angle) * RING_RADIUS
            );
            dummy.scale.set(1, amp, 1);
            dummy.rotation.y = -angle;
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
            // Hotter bars glow toward bone-white
            color.copy(EMBER).lerp(BONE, Math.min(1, Math.max(0, (amp - 0.4) * 1.1)));
            mesh.current.setColorAt(i, color);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, BAR_COUNT]}>
            <boxGeometry args={[0.055, 1, 0.055]} />
            <meshStandardMaterial
                emissiveIntensity={2.2}
                emissive="#dc2626"
                color="#1a1a20"
                toneMapped={false}
            />
        </instancedMesh>
    );
}

/** Gentle mouse-parallax on the whole composition. */
function Rig({ children }: { children: React.ReactNode }) {
    const group = useRef<THREE.Group>(null!);
    useFrame(({ pointer }, delta) => {
        const targetX = pointer.y * 0.12;
        const targetY = pointer.x * 0.25;
        group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 2.5, delta);
        group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 2.5, delta);
    });
    return <group ref={group}>{children}</group>;
}

export default function VinylScene() {
    return (
        <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 2.1, 7.2], fov: 38 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
        >
            {/* Cinematic three-point lighting — no external HDRIs needed */}
            <ambientLight intensity={0.25} />
            <spotLight position={[4, 8, 6]} angle={0.5} penumbra={0.8} intensity={130} color="#ffffff" castShadow />
            <pointLight position={[-7, 2, -4]} intensity={60} color="#dc2626" />
            <pointLight position={[7, 1, -6]} intensity={25} color="#22d3ee" />

            <Suspense fallback={null}>
                <Rig>
                    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.5}>
                        <group rotation={[0.42, 0, -0.06]}>
                            <VinylDisc />
                            <EqualizerRing />
                        </group>
                    </Float>
                    <Sparkles count={90} scale={[14, 7, 10]} size={1.6} speed={0.25} opacity={0.35} color="#f87171" />
                    <ContactShadows position={[0, -2.6, 0]} opacity={0.55} scale={16} blur={2.8} far={4} color="#000000" />
                </Rig>
            </Suspense>
        </Canvas>
    );
}
