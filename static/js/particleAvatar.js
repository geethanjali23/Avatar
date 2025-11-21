// particleAvatar.js — H-Aura 3D Particle Hologram
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, particleSystem, auraWave = 0;
let talkingBoost = 0;

const canvas = document.getElementById("avatarCanvas");
init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 95);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(340, 340);
    renderer.setPixelRatio(window.devicePixelRatio);

    const particles = 2800;
    const points = new Float32Array(particles * 3);
    for (let i = 0; i < particles * 3; i += 3) {
        const a = Math.random() * Math.PI * 2;
        const r = 25 + Math.random() * 12;
        points[i] = Math.cos(a) * r;
        points[i + 1] = (Math.random() - 0.5) * 30;
        points[i + 2] = Math.sin(a) * r;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ffe6,
        size: 0.85,
        transparent: true,
        opacity: 0.82
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
}

function animate() {
    requestAnimationFrame(animate);

    auraWave += 0.0025;
    particleSystem.rotation.y += 0.002;

    const pos = particleSystem.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3 + 1] += Math.sin(auraWave + i * 0.005) * 0.03;
    }
    pos.needsUpdate = true;

    if (talkingBoost > 0) {
        particleSystem.material.size = 1 + talkingBoost * 1.8;
        talkingBoost *= 0.92;
    } else particleSystem.material.size = 1.1;

    renderer.render(scene, camera);
}

window.addEventListener("avatar-talking-start", () => talkingBoost = 1.4);
window.addEventListener("avatar-talking-stop", () => talkingBoost = 0.4);
