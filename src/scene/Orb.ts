import * as THREE from "three";

/**
 * Orb - a 3D sphere that orbits around origin and exposes hover/click hooks.
 * Lightweight: no DOM manipulation here; SceneManager will handle raycasting and overlay.
 */
export class Orb {
  public mesh: THREE.Mesh;
  public label: string;
  public color: THREE.Color;
  public radius: number;
  // orbit params
  public orbitRadius: number;
  public speed: number;
  public phase: number;

  constructor(label: string, colorHex: string, orbitRadius = 150, radius = 18) {
    this.label = label;
    this.color = new THREE.Color(colorHex);
    this.radius = radius;
    this.orbitRadius = orbitRadius;
    this.speed = 0.2 + Math.random() * 0.5;
    this.phase = Math.random() * Math.PI * 2;

    const geo = new THREE.IcosahedronGeometry(radius, 3);
    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      metalness: 0.3,
      roughness: 0.25,
      emissive: new THREE.Color(this.color).multiplyScalar(0.04),
      transparent: true,
      opacity: 0.98,
      envMapIntensity: 0.6,
    });
    this.mesh = new THREE.Mesh(geo, mat);

    // soft bloom-like emissive ring using second scaled mesh (subtle)
    const ringGeo = new THREE.SphereGeometry(radius * 1.6, 24, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.06,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(ring);
  }

  // set position based on elapsed time
  setOrbit(timeSec: number) {
    const t = timeSec * (this.speed * 0.2) + this.phase;
    const x = Math.cos(t) * this.orbitRadius;
    const z = Math.sin(t) * this.orbitRadius * 0.7; // elliptical orbit for depth
    const y = Math.sin(t * 0.6 + this.phase) * (this.orbitRadius * 0.12);
    this.mesh.position.set(x, y, z);
    // subtle rotation to feel "alive"
    this.mesh.rotation.y = t * 0.6;
    this.mesh.rotation.x = t * 0.3;
  }

  // hover effect: scale + material brightness
  setHover(on: boolean) {
    const targetScale = on ? 1.28 : 1.0;
    this.mesh.scale.setScalar(targetScale);
    const mat = this.mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = on ? 1.6 : 0.4;
    mat.roughness = on ? 0.1 : 0.25;
  }

  // "expand" animation — SceneManager will show panel
  expand() {
    // small pop/particle hook could go here
    this.mesh.scale.setScalar(1.6);
  }
}
