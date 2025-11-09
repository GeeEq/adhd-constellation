import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Orb } from "./Orb";

type OrbDef = { label: string; color: string; orbit: number; radius?: number; };

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private clock = new THREE.Clock();
  private orbs: Orb[] = [];
  private domLabels: HTMLElement[] = [];

  // an onSelect callback to notify UI overlay
  public onSelect: (orb: Orb) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x071028, 1);

    // scene + camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 80, 420);

    // lights
    const amb = new THREE.AmbientLight(0xffffff, 0.18);
    this.scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(120, 200, 100);
    this.scene.add(key);
    // soft fill
    const fill = new THREE.PointLight(0x0fb3a3, 0.18, 1000);
    fill.position.set(-100, -80, 200);
    this.scene.add(fill);

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = 200;
    this.controls.maxDistance = 900;
    this.controls.autoRotate = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;

    // responsive
    window.addEventListener("resize", this.onResize.bind(this), false);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove.bind(this), { passive: true });
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown.bind(this), { passive: true });

    // build orbs from definition
    const defs: OrbDef[] = [
      { label: "Hyperfocus", color: "#FF7AA2", orbit: 180 },
      { label: "Ideas", color: "#8AE3FF", orbit: 230 },
      { label: "Tasks", color: "#FFD57A", orbit: 140 },
      { label: "Memory", color: "#C2A1FF", orbit: 200 },
      { label: "Random", color: "#7AF7B8", orbit: 260 },
      { label: "Projects", color: "#FFB48F", orbit: 320 },
    ];

    defs.forEach(d => this.addOrb(d));

    // nucleus
    this.addNucleus();

    this.tick();
  }

  private addNucleus() {
    const geo = new THREE.SphereGeometry(38, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x061926,
      metalness: 0.1,
      roughness: 0.6,
      emissive: 0x0fb3a3,
      emissiveIntensity: 0.06,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);

    // breathing animation via update loop
    // (we store it as a child for simple transform)
    mesh.userData = { breatheBase: 1, mesh };
  }

  private addOrb(def: OrbDef) {
    const orb = new Orb(def.label, def.color, def.orbit, def.radius ?? 18);
    this.orbs.push(orb);
    this.scene.add(orb.mesh);

    // create DOM label (absolute position updated every frame)
    const lbl = document.createElement("div");
    lbl.className = "orbLabel";
    lbl.innerText = def.label;
    document.body.appendChild(lbl);
    this.domLabels.push(lbl);
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onPointerMove(ev: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(ev: PointerEvent) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.orbs.map(o => o.mesh), true);
    if (intersects.length) {
      const mesh = intersects[0].object;
      const orb = this.orbs.find(o => o.mesh === mesh || mesh.parent === o.mesh);
      if (orb) {
        orb.expand();
        this.onSelect(orb);
      }
    }
  }

  private tick = () => {
    requestAnimationFrame(this.tick);
    const t = this.clock.getElapsedTime();

    // nucleus breathing
    this.scene.traverse((obj: any) => {
      if (obj.userData && obj.userData.breatheBase) {
        const base = obj.userData.breatheBase;
        const s = 1 + Math.sin(t * 0.6) * 0.04;
        obj.scale.setScalar(s);
      }
    });

    // update orbs
    this.orbs.forEach((orb, i) => {
      orb.setOrbit(t);
      // hover detection via raycast
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(orb.mesh, true);
      const hover = intersects.length > 0;
      orb.setHover(hover);

      // update DOM label position
      const worldPos = new THREE.Vector3();
      orb.mesh.getWorldPosition(worldPos);
      const projected = worldPos.project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      const label = this.domLabels[i];
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.opacity = hover ? "1" : "0.86";
      label.style.transform = hover ? "translate(-50%,-140%) scale(1.02)" : "translate(-50%,-140%) scale(1)";
    });

    // animate controls damping
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
