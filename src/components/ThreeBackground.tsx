"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 20;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // --- 1. EARTH GEOMETRY & SHADER ---
        const geometry = new THREE.SphereGeometry(10, 128, 128);

        const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vPosition;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vPosition = position;
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

        const fragmentShader = `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vPosition;

        void main() {
            // Grid Logic
            float gridDensity = 40.0;
            vec2 grid = abs(fract(vUv * gridDensity - 0.5) - 0.5) / fwidth(vUv * gridDensity);
            float line = min(grid.x, grid.y);
            float lineAlpha = 1.0 - min(line, 1.0);
            
            // Lighting / Fresnel
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - dot(normal, viewDir), 2.5);

            // Scanline Effect
            float scanSpeed = 2.0;
            float scan = sin(vPosition.y * 0.5 + uTime * scanSpeed);
            float scanMask = smoothstep(0.95, 1.0, scan);
            float scanGlow = smoothstep(0.0, 1.0, scan) * 0.3;

            // Colors
            vec3 baseColor = vec3(0.01, 0.02, 0.05);
            vec3 gridColor = vec3(0.1, 0.25, 0.45);
            vec3 scanColor = vec3(0.4, 0.6, 1.0); // Bright Blue
            
            vec3 finalColor = baseColor;
            finalColor += gridColor * lineAlpha * 0.2; 
            finalColor += scanColor * lineAlpha * scanMask * 0.8;
            finalColor += scanColor * scanGlow * 0.05;
            finalColor += gridColor * fresnel * 0.5;
            finalColor += scanColor * fresnel * scanGlow * 0.5;

            gl_FragColor = vec4(finalColor, 0.95);
        }
    `;

        const material = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader,
            fragmentShader,
            transparent: true,
            extensions: { derivatives: true } as any
        });
        const earth = new THREE.Mesh(geometry, material);
        scene.add(earth);

        // --- 2. ATMOSPHERE GLOW ---
        const atmoGeo = new THREE.SphereGeometry(10.5, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
            fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float dotProduct = dot(normal, viewDir);
                float factor = pow(0.6 - dotProduct, 4.0);
                gl_FragColor = vec4(0.1, 0.2, 0.4, factor * 0.4);
            }
        `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const atmo = new THREE.Mesh(atmoGeo, atmoMat);
        scene.add(atmo);

        // --- 3. BACKGROUND NEBULA ---
        const bgGeo = new THREE.SphereGeometry(100, 32, 32);
        const bgMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            side: THREE.BackSide,
            vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
            fragmentShader: `
            uniform float uTime;
            varying vec3 vWorldPosition;
            
            float random (in vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            float noise (in vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                vec2 uv = vWorldPosition.xy * 0.01;
                float n1 = noise(uv + uTime * 0.05);
                float n2 = noise(uv * 2.0 - uTime * 0.03);
                float combined = mix(n1, n2, 0.5);
                float vignette = 1.0 - length(vWorldPosition.xy) * 0.005;
                vec3 skyColor = vec3(0.01, 0.03, 0.06); 
                vec3 cloudColor = vec3(0.05, 0.1, 0.15); 
                vec3 finalColor = mix(skyColor, cloudColor, combined * 0.3);
                gl_FragColor = vec4(finalColor * vignette, 1.0);
            }
        `
        });
        const backgroundSphere = new THREE.Mesh(bgGeo, bgMat);
        scene.add(backgroundSphere);

        // --- 4. NETWORK WIREFRAME ---
        const wireGeo = new THREE.SphereGeometry(10.1, 64, 64);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.03 });
        const network = new THREE.Mesh(wireGeo, wireMat);
        scene.add(network);

        // --- 5. TALENT NODES ---
        const nodesCount = 150;
        const nodesPos = [];
        const nodesPhase = [];
        for (let i = 0; i < nodesCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodesCount);
            const theta = Math.sqrt(nodesCount * Math.PI) * phi;
            const r = 10.08;
            nodesPos.push(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));
            nodesPhase.push(Math.random() * Math.PI * 2);
        }
        const nodesGeo = new THREE.BufferGeometry();
        nodesGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodesPos, 3));
        nodesGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(nodesPhase, 1));
        const nodesMaterial = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x60a5fa) } },
            vertexShader: `
            attribute float aPhase;
            varying float vAlpha;
            uniform float uTime;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = 6.0 * (30.0 / -mvPosition.z);
                float blink = sin(uTime * 1.5 + aPhase);
                vAlpha = smoothstep(0.6, 1.0, blink); 
            }
        `,
            fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
                if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                float strength = 1.0 - (length(gl_PointCoord - vec2(0.5)) * 2.0);
                strength = pow(strength, 1.5);
                gl_FragColor = vec4(uColor, vAlpha * strength);
            }
        `,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        const talentNodes = new THREE.Points(nodesGeo, nodesMaterial);
        scene.add(talentNodes);

        // --- 6. TWINKLING STARS ---
        const starCount = 800;
        const starPos = [];
        const starPhase = [];
        const starSize = [];
        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * 150;
            const y = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            if (Math.abs(x) < 20 && Math.abs(y) < 20 && Math.abs(z) < 20) continue;
            starPos.push(x, y, z);
            starPhase.push(Math.random() * Math.PI * 2);
            starSize.push(Math.random() * 1.5 + 0.5);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        starGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(starPhase, 1));
        starGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(starSize, 1));
        const starShaderMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x94a3b8) } },
            vertexShader: `
            attribute float aPhase;
            attribute float aSize;
            varying float vAlpha;
            uniform float uTime;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = aSize * (20.0 / -mvPosition.z);
                float blink = sin(uTime * 0.5 + aPhase);
                vAlpha = 0.3 + 0.7 * (blink * 0.5 + 0.5); 
            }
        `,
            fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float strength = 1.0 - (dist * 2.0);
                gl_FragColor = vec4(uColor, vAlpha * strength);
            }
        `,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        const stars = new THREE.Points(starGeo, starShaderMat);
        scene.add(stars);

        // Positions & Resize
        const updatePosition = () => {
            if (window.innerWidth > 1024) {
                earth.position.set(4, -6, 0);
                earth.scale.set(1.4, 1.4, 1.4);
            } else {
                earth.position.set(0, -9, 0);
                earth.scale.set(1.0, 1.0, 1.0);
            }
            atmo.position.copy(earth.position); atmo.scale.copy(earth.scale);
            network.position.copy(earth.position); network.scale.copy(earth.scale);
            talentNodes.position.copy(earth.position); talentNodes.scale.copy(earth.scale);
        };
        updatePosition();

        // Animation Loop
        let reqId: number;
        const animate = () => {
            reqId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            // Update Uniforms
            material.uniforms.uTime.value = time;
            nodesMaterial.uniforms.uTime.value = time;
            starShaderMat.uniforms.uTime.value = time;
            bgMat.uniforms.uTime.value = time;

            // Rotations
            earth.rotation.y += 0.0005;
            atmo.rotation.y += 0.0005;
            talentNodes.rotation.y += 0.0005;
            network.rotation.y += 0.0006;
            stars.rotation.y -= 0.0001;
            backgroundSphere.rotation.z += 0.0002;

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updatePosition();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(reqId);
            window.removeEventListener('resize', handleResize);
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="fixed top-0 left-0 w-full h-screen z-0 pointer-events-none transition-opacity duration-1000" id="canvas-container" />;
}
