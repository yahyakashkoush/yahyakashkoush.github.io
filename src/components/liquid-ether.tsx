"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "cn";

/**
 * A WebGL fluid simulation (Navier–Stokes, solved on the GPU) used as ambient
 * motion behind the hero portrait. Ported from a vanilla-JS build of the
 * "LiquidEther" effect rather than reimplemented, since the physics and
 * shaders are the whole point and are already correct.
 *
 * Mounted client-side only, after hydration — the hero's photo is still the
 * LCP element and paints without waiting on this. Pauses itself when the tab
 * is hidden or the canvas leaves the viewport, and never mounts at all under
 * `prefers-reduced-motion`.
 */

export type LiquidEtherOptions = {
  colors: string[];
  mouseForce: number;
  cursorSize: number;
  isViscous: boolean;
  viscous: number;
  iterationsViscous: number;
  iterationsPoisson: number;
  dt: number;
  BFECC: boolean;
  resolution: number;
  isBounce: boolean;
  autoDemo: boolean;
  autoSpeed: number;
  autoIntensity: number;
  takeoverDuration: number;
  autoResumeDelay: number;
  autoRampDuration: number;
};

const DEFAULTS: LiquidEtherOptions = {
  colors: ["#D9E6FF"],
  mouseForce: 20,
  cursorSize: 100,
  isViscous: false,
  viscous: 30,
  iterationsViscous: 32,
  iterationsPoisson: 32,
  dt: 0.014,
  BFECC: true,
  resolution: 0.5,
  isBounce: false,
  autoDemo: true,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  takeoverDuration: 0.25,
  autoResumeDelay: 3000,
  autoRampDuration: 0.6,
};

type Fbo = THREE.WebGLRenderTarget;

const VERT_BOUNDARY_SPACE = `
  attribute vec3 position;
  uniform vec2 px;
  uniform vec2 boundarySpace;
  varying vec2 uv;
  precision highp float;
  void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5)+(pos.xy)*0.5;
  gl_Position = vec4(pos, 1.0);
}
`;

const FRAG_ADVECTION = `
    precision highp float;
    uniform sampler2D velocity;
    uniform float dt;
    uniform bool isBFECC;
    uniform vec2 fboSize;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
    if(isBFECC == false){
        vec2 vel = texture2D(velocity, uv).xy;
        vec2 uv2 = uv - vel * dt * ratio;
        vec2 newVel = texture2D(velocity, uv2).xy;
        gl_FragColor = vec4(newVel, 0.0, 0.0);
    } else {
        vec2 spot_new = uv;
        vec2 vel_old = texture2D(velocity, uv).xy;
        vec2 spot_old = spot_new - vel_old * dt * ratio;
        vec2 vel_new1 = texture2D(velocity, spot_old).xy;
        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
        vec2 error = spot_new2 - spot_new;
        vec2 spot_new3 = spot_new - error / 2.0;
        vec2 vel_2 = texture2D(velocity, spot_new3).xy;
        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
        vec2 newVel2 = texture2D(velocity, spot_old2).xy;
        gl_FragColor = vec4(newVel2, 0.0, 0.0);
    }
}
`;

function makePaletteTexture(colorsArr: string[]) {
  const normalized = colorsArr.length > 0 ? (colorsArr.length === 1 ? [colorsArr[0], colorsArr[0]] : colorsArr) : ["#ffffff", "#ffffff"];
  const count = normalized.length;
  const data = new Uint8Array(4 * count);
  for (let i = 0; i < count; i++) {
    const c = new THREE.Color(normalized[i]);
    data[4 * i + 0] = Math.round(255 * c.r);
    data[4 * i + 1] = Math.round(255 * c.g);
    data[4 * i + 2] = Math.round(255 * c.b);
    data[4 * i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, count, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** One instance's whole world — renderer, sim state, listeners — closed over so multiple mounts never share state. */
function createLiquidEther(container: HTMLElement, opts: LiquidEtherOptions) {
  const options = { ...DEFAULTS, ...opts };
  let rafId: number | null = null;
  let isVisible = true;

  const paletteTexture = makePaletteTexture(options.colors);
  const bgColor = new THREE.Vector4(0, 0, 0, 0);

  class Common {
    width = 0;
    height = 0;
    aspect = 1;
    pixelRatio = 1;
    time = 0;
    delta = 0;
    container: HTMLElement | null = null;
    renderer: THREE.WebGLRenderer | null = null;
    clock: THREE.Clock | null = null;

    init(el: HTMLElement) {
      this.container = el;
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.resize();
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.autoClear = false;
      this.renderer.setClearColor(new THREE.Color(0), 0);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.width, this.height);
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
      this.renderer.domElement.style.display = "block";
      this.clock = new THREE.Clock();
      this.clock.start();
    }
    resize() {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(1, Math.floor(rect.width));
      this.height = Math.max(1, Math.floor(rect.height));
      this.aspect = this.width / this.height;
      this.renderer?.setSize(this.width, this.height, false);
    }
    update() {
      this.delta = this.clock!.getDelta();
      this.time += this.delta;
    }
  }
  const common = new Common();

  class Mouse {
    mouseMoved = false;
    coords = new THREE.Vector2();
    coords_old = new THREE.Vector2();
    diff = new THREE.Vector2();
    timer: number | null = null;
    container: HTMLElement | null = null;
    docTarget: Document | null = null;
    listenerTarget: (Window & typeof globalThis) | null = null;
    isHoverInside = false;
    hasUserControl = false;
    isAutoActive = false;
    autoIntensity = 2;
    takeoverActive = false;
    takeoverStartTime = 0;
    takeoverDuration = 0.25;
    takeoverFrom = new THREE.Vector2();
    takeoverTo = new THREE.Vector2();
    onInteract: (() => void) | null = null;

    private _onMouseMove = this.onDocumentMouseMove.bind(this);
    private _onTouchStart = this.onDocumentTouchStart.bind(this);
    private _onTouchMove = this.onDocumentTouchMove.bind(this);
    private _onTouchEnd = this.onTouchEnd.bind(this);
    private _onDocumentLeave = this.onDocumentLeave.bind(this);

    init(el: HTMLElement) {
      this.container = el;
      this.docTarget = el.ownerDocument || null;
      const win = this.docTarget?.defaultView || window;
      this.listenerTarget = win;
      win.addEventListener("mousemove", this._onMouseMove);
      win.addEventListener("touchstart", this._onTouchStart, { passive: true });
      win.addEventListener("touchmove", this._onTouchMove, { passive: true });
      win.addEventListener("touchend", this._onTouchEnd);
      this.docTarget?.addEventListener("mouseleave", this._onDocumentLeave);
    }
    dispose() {
      if (this.listenerTarget) {
        this.listenerTarget.removeEventListener("mousemove", this._onMouseMove);
        this.listenerTarget.removeEventListener("touchstart", this._onTouchStart);
        this.listenerTarget.removeEventListener("touchmove", this._onTouchMove);
        this.listenerTarget.removeEventListener("touchend", this._onTouchEnd);
      }
      this.docTarget?.removeEventListener("mouseleave", this._onDocumentLeave);
    }
    isPointInside(x: number, y: number) {
      if (!this.container) return false;
      const r = this.container.getBoundingClientRect();
      return r.width !== 0 && r.height !== 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }
    updateHoverState(x: number, y: number) {
      return (this.isHoverInside = this.isPointInside(x, y));
    }
    setCoords(x: number, y: number) {
      if (!this.container) return;
      if (this.timer) window.clearTimeout(this.timer);
      const r = this.container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = (x - r.left) / r.width;
      const ny = (y - r.top) / r.height;
      this.coords.set(2 * nx - 1, -(2 * ny - 1));
      this.mouseMoved = true;
      this.timer = window.setTimeout(() => {
        this.mouseMoved = false;
      }, 100);
    }
    setNormalized(x: number, y: number) {
      this.coords.set(x, y);
      this.mouseMoved = true;
    }
    onDocumentMouseMove(e: MouseEvent) {
      if (this.updateHoverState(e.clientX, e.clientY)) {
        this.onInteract?.();
        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
          if (!this.container) return;
          const r = this.container.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const nx = (e.clientX - r.left) / r.width;
          const ny = (e.clientY - r.top) / r.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(2 * nx - 1, -(2 * ny - 1));
          this.takeoverStartTime = performance.now();
          this.takeoverActive = true;
          this.hasUserControl = true;
          this.isAutoActive = false;
          return;
        }
        this.setCoords(e.clientX, e.clientY);
        this.hasUserControl = true;
      }
    }
    onDocumentTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (this.updateHoverState(t.clientX, t.clientY)) {
        this.onInteract?.();
        this.setCoords(t.clientX, t.clientY);
        this.hasUserControl = true;
      }
    }
    onDocumentTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (this.updateHoverState(t.clientX, t.clientY)) {
        this.onInteract?.();
        this.setCoords(t.clientX, t.clientY);
      }
    }
    onTouchEnd() {
      this.isHoverInside = false;
    }
    onDocumentLeave() {
      this.isHoverInside = false;
    }
    update() {
      if (this.takeoverActive) {
        const progress = (performance.now() - this.takeoverStartTime) / (1000 * this.takeoverDuration);
        if (progress >= 1) {
          this.takeoverActive = false;
          this.coords.copy(this.takeoverTo);
          this.coords_old.copy(this.coords);
          this.diff.set(0, 0);
        } else {
          this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, progress * progress * (3 - 2 * progress));
        }
      }
      this.diff.subVectors(this.coords, this.coords_old);
      this.coords_old.copy(this.coords);
      if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
      if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
    }
  }
  const mouse = new Mouse();

  class AutoDriver {
    active = false;
    current = new THREE.Vector2(0, 0);
    target = new THREE.Vector2();
    lastTime = performance.now();
    activationTime = 0;
    margin = 0.2;
    private _tmpDir = new THREE.Vector2();
    enabled: boolean;
    speed: number;
    resumeDelay: number;
    rampDurationMs: number;

    constructor(
      private mouse: Mouse,
      private manager: { lastUserInteraction: number },
      opts: { enabled: boolean; speed: number; resumeDelay?: number; rampDuration?: number },
    ) {
      this.enabled = opts.enabled;
      this.speed = opts.speed;
      this.resumeDelay = opts.resumeDelay || 3000;
      this.rampDurationMs = 1000 * (opts.rampDuration || 0);
      this.pickNewTarget();
    }
    pickNewTarget() {
      const r = Math.random;
      this.target.set((2 * r() - 1) * (1 - this.margin), (2 * r() - 1) * (1 - this.margin));
    }
    forceStop() {
      this.active = false;
      this.mouse.isAutoActive = false;
    }
    update() {
      if (!this.enabled) return;
      const now = performance.now();
      if (now - this.manager.lastUserInteraction < this.resumeDelay || this.mouse.isHoverInside) {
        if (this.active) this.forceStop();
        return;
      }
      if (!this.active) {
        this.active = true;
        this.current.copy(this.mouse.coords);
        this.lastTime = now;
        this.activationTime = now;
      }
      this.mouse.isAutoActive = true;
      let dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dt > 0.2) dt = 0.016;
      const dir = this._tmpDir.subVectors(this.target, this.current);
      const dist = dir.length();
      if (dist < 0.01) {
        this.pickNewTarget();
        return;
      }
      dir.normalize();
      let ramp = 1;
      if (this.rampDurationMs > 0) {
        const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
        ramp = t * t * (3 - 2 * t);
      }
      const step = this.speed * dt * ramp;
      this.current.addScaledVector(dir, Math.min(step, dist));
      this.mouse.setNormalized(this.current.x, this.current.y);
    }
  }

  type PassProps = {
    material?: THREE.ShaderMaterialParameters;
    output?: Fbo | null;
    output0?: Fbo;
    output1?: Fbo;
  };

  class ShaderPass {
    props: PassProps;
    uniforms?: Record<string, THREE.IUniform>;
    scene: THREE.Scene | null = null;
    camera: THREE.Camera | null = null;
    material: THREE.RawShaderMaterial | null = null;
    geometry: THREE.PlaneGeometry | null = null;
    plane: THREE.Mesh | null = null;

    constructor(props?: PassProps) {
      this.props = props || {};
      this.uniforms = this.props.material?.uniforms as Record<string, THREE.IUniform> | undefined;
    }
    init() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      if (this.uniforms) {
        this.material = new THREE.RawShaderMaterial(this.props.material);
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
      }
    }
    // Named `render`, not `update`: every subclass below defines its own
    // `update(args)` with a shape specific to that pass, which would collide
    // with a same-named base method under TS's method-override checking.
    render() {
      common.renderer!.setRenderTarget(this.props.output ?? null);
      common.renderer!.render(this.scene!, this.camera!);
      common.renderer!.setRenderTarget(null);
    }
  }

  class Advection extends ShaderPass {
    line!: THREE.LineSegments;
    constructor(e: { cellScale: THREE.Vector2; fboSize: THREE.Vector2; dt: number; src: Fbo; dst: Fbo }) {
      super({
        material: {
          vertexShader: VERT_BOUNDARY_SPACE,
          fragmentShader: FRAG_ADVECTION,
          uniforms: {
            boundarySpace: { value: e.cellScale },
            px: { value: e.cellScale },
            fboSize: { value: e.fboSize },
            velocity: { value: e.src.texture },
            dt: { value: e.dt },
            isBFECC: { value: true },
          },
        },
        output: e.dst,
      });
      this.uniforms = this.props.material!.uniforms as Record<string, THREE.IUniform>;
      this.init();
      this.createBoundary();
    }
    createBoundary() {
      const geo = new THREE.BufferGeometry();
      const verts = new Float32Array([-1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0]);
      geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
      const mat = new THREE.RawShaderMaterial({
        vertexShader: `
  attribute vec3 position;
  uniform vec2 px;
  precision highp float;
  varying vec2 uv;
  void main(){
  vec3 pos = position;
  uv = 0.5 + pos.xy * 0.5;
  vec2 n = sign(pos.xy);
  pos.xy = abs(pos.xy) - px * 1.0;
  pos.xy *= n;
  gl_Position = vec4(pos, 1.0);
}
`,
        fragmentShader: FRAG_ADVECTION,
        uniforms: this.uniforms,
      });
      this.line = new THREE.LineSegments(geo, mat);
      this.scene!.add(this.line);
    }
    update({ dt, isBounce, BFECC }: { dt: number; isBounce: boolean; BFECC: boolean }) {
      this.uniforms!.dt.value = dt;
      this.line.visible = isBounce;
      this.uniforms!.isBFECC.value = BFECC;
      super.render();
    }
  }

  class ExternalForce extends ShaderPass {
    mouseMesh!: THREE.Mesh;
    constructor(e: { cellScale: THREE.Vector2; cursor_size: number; dst: Fbo }) {
      super({ output: e.dst });
      this.initForce(e);
    }
    initForce(e: { cellScale: THREE.Vector2; cursor_size: number }) {
      super.init();
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.RawShaderMaterial({
        vertexShader: `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform vec2 center;
    uniform vec2 scale;
    uniform vec2 px;
    varying vec2 vUv;
    void main(){
    vec2 pos = position.xy * scale * 2.0 * px + center;
    vUv = uv;
    gl_Position = vec4(pos, 0.0, 1.0);
}
`,
        fragmentShader: `
    precision highp float;
    uniform vec2 force;
    uniform vec2 center;
    uniform vec2 scale;
    uniform vec2 px;
    varying vec2 vUv;
    void main(){
    vec2 circle = (vUv - 0.5) * 2.0;
    float d = 1.0 - min(length(circle), 1.0);
    d *= d;
    gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          px: { value: e.cellScale },
          force: { value: new THREE.Vector2(0, 0) },
          center: { value: new THREE.Vector2(0, 0) },
          scale: { value: new THREE.Vector2(e.cursor_size, e.cursor_size) },
        },
      });
      this.mouseMesh = new THREE.Mesh(geo, mat);
      this.scene!.add(this.mouseMesh);
    }
    update(e: { cursor_size: number; mouse_force: number; cellScale: THREE.Vector2 }) {
      const fx = (mouse.diff.x / 2) * e.mouse_force;
      const fy = (mouse.diff.y / 2) * e.mouse_force;
      const rx = e.cursor_size * e.cellScale.x;
      const ry = e.cursor_size * e.cellScale.y;
      const cx = Math.min(Math.max(mouse.coords.x, -1 + rx + 2 * e.cellScale.x), 1 - rx - 2 * e.cellScale.x);
      const cy = Math.min(Math.max(mouse.coords.y, -1 + ry + 2 * e.cellScale.y), 1 - ry - 2 * e.cellScale.y);
      const uniforms = (this.mouseMesh.material as THREE.RawShaderMaterial).uniforms;
      (uniforms.force.value as THREE.Vector2).set(fx, fy);
      (uniforms.center.value as THREE.Vector2).set(cx, cy);
      (uniforms.scale.value as THREE.Vector2).set(e.cursor_size, e.cursor_size);
      super.render();
    }
  }

  class Viscous extends ShaderPass {
    constructor(e: { boundarySpace: THREE.Vector2; cellScale: THREE.Vector2; viscous: number; src: Fbo; dst: Fbo; dst_: Fbo; dt: number }) {
      super({
        material: {
          vertexShader: VERT_BOUNDARY_SPACE,
          fragmentShader: `
    precision highp float;
    uniform sampler2D velocity;
    uniform sampler2D velocity_new;
    uniform float v;
    uniform vec2 px;
    uniform float dt;
    varying vec2 uv;
    void main(){
    vec2 old = texture2D(velocity, uv).xy;
    vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
    vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
    vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
    vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
    vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
    newv /= 4.0 * (1.0 + v * dt);
    gl_FragColor = vec4(newv, 0.0, 0.0);
}
`,
          uniforms: {
            boundarySpace: { value: e.boundarySpace },
            velocity: { value: e.src.texture },
            velocity_new: { value: e.dst_.texture },
            v: { value: e.viscous },
            px: { value: e.cellScale },
            dt: { value: e.dt },
          },
        },
        output: e.dst,
        output0: e.dst_,
        output1: e.dst,
      });
      this.init();
    }
    update({ viscous, iterations, dt }: { viscous: number; iterations: number; dt: number }): Fbo {
      let outA: Fbo, outB: Fbo;
      this.uniforms!.v.value = viscous;
      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          outA = this.props.output0!;
          outB = this.props.output1!;
        } else {
          outA = this.props.output1!;
          outB = this.props.output0!;
        }
        this.uniforms!.velocity_new.value = outA.texture;
        this.props.output = outB;
        this.uniforms!.dt.value = dt;
        super.render();
      }
      return outB!;
    }
  }

  class Divergence extends ShaderPass {
    constructor(e: { boundarySpace: THREE.Vector2; cellScale: THREE.Vector2; src: Fbo; dst: Fbo; dt: number }) {
      super({
        material: {
          vertexShader: VERT_BOUNDARY_SPACE,
          fragmentShader: `
    precision highp float;
    uniform sampler2D velocity;
    uniform float dt;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
    float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
    float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
    float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
    float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
    float divergence = (x1 - x0 + y1 - y0) / 2.0;
    gl_FragColor = vec4(divergence / dt);
}
`,
          uniforms: {
            boundarySpace: { value: e.boundarySpace },
            velocity: { value: e.src.texture },
            px: { value: e.cellScale },
            dt: { value: e.dt },
          },
        },
        output: e.dst,
      });
      this.init();
    }
    update({ vel }: { vel: Fbo }) {
      this.uniforms!.velocity.value = vel.texture;
      super.render();
    }
  }

  class Poisson extends ShaderPass {
    constructor(e: { boundarySpace: THREE.Vector2; cellScale: THREE.Vector2; src: Fbo; dst: Fbo; dst_: Fbo }) {
      super({
        material: {
          vertexShader: VERT_BOUNDARY_SPACE,
          fragmentShader: `
    precision highp float;
    uniform sampler2D pressure;
    uniform sampler2D divergence;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
    float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
    float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
    float div = texture2D(divergence, uv).r;
    float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
    gl_FragColor = vec4(newP);
}
`,
          uniforms: {
            boundarySpace: { value: e.boundarySpace },
            pressure: { value: e.dst_.texture },
            divergence: { value: e.src.texture },
            px: { value: e.cellScale },
          },
        },
        output: e.dst,
        output0: e.dst_,
        output1: e.dst,
      });
      this.init();
    }
    update({ iterations }: { iterations: number }): Fbo {
      let outA: Fbo, outB: Fbo;
      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          outA = this.props.output0!;
          outB = this.props.output1!;
        } else {
          outA = this.props.output1!;
          outB = this.props.output0!;
        }
        this.uniforms!.pressure.value = outA.texture;
        this.props.output = outB;
        super.render();
      }
      return outB!;
    }
  }

  class Pressure extends ShaderPass {
    constructor(e: { boundarySpace: THREE.Vector2; cellScale: THREE.Vector2; src_p: Fbo; src_v: Fbo; dst: Fbo; dt: number }) {
      super({
        material: {
          vertexShader: VERT_BOUNDARY_SPACE,
          fragmentShader: `
    precision highp float;
    uniform sampler2D pressure;
    uniform sampler2D velocity;
    uniform vec2 px;
    uniform float dt;
    varying vec2 uv;
    void main(){
    float step = 1.0;
    float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;
    float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;
    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;
    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;
    vec2 v = texture2D(velocity, uv).xy;
    vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
    v = v - gradP * dt;
    gl_FragColor = vec4(v, 0.0, 1.0);
}
`,
          uniforms: {
            boundarySpace: { value: e.boundarySpace },
            pressure: { value: e.src_p.texture },
            velocity: { value: e.src_v.texture },
            px: { value: e.cellScale },
            dt: { value: e.dt },
          },
        },
        output: e.dst,
      });
      this.init();
    }
    update({ vel, pressure }: { vel: Fbo; pressure: Fbo }) {
      this.uniforms!.velocity.value = vel.texture;
      this.uniforms!.pressure.value = pressure.texture;
      super.render();
    }
  }

  class Simulation {
    options: {
      iterations_poisson: number;
      iterations_viscous: number;
      mouse_force: number;
      resolution: number;
      cursor_size: number;
      viscous: number;
      isBounce: boolean;
      dt: number;
      isViscous: boolean;
      BFECC: boolean;
    };
    fbos: Record<"vel_0" | "vel_1" | "vel_viscous0" | "vel_viscous1" | "div" | "pressure_0" | "pressure_1", Fbo> = {} as never;
    fboSize = new THREE.Vector2();
    cellScale = new THREE.Vector2();
    boundarySpace = new THREE.Vector2();
    advection!: Advection;
    externalForce!: ExternalForce;
    viscous!: Viscous;
    divergence!: Divergence;
    poisson!: Poisson;
    pressure!: Pressure;

    constructor(e: Simulation["options"]) {
      this.options = e;
      this.init();
    }
    init() {
      this.calcSize();
      this.createAllFBO();
      this.createShaderPass();
    }
    getFloatType() {
      return /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;
    }
    createAllFBO() {
      const fboOpts: THREE.RenderTargetOptions = {
        type: this.getFloatType(),
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      };
      const keys: Array<keyof Simulation["fbos"]> = ["vel_0", "vel_1", "vel_viscous0", "vel_viscous1", "div", "pressure_0", "pressure_1"];
      for (const key of keys) this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, fboOpts);
    }
    createShaderPass() {
      this.advection = new Advection({ cellScale: this.cellScale, fboSize: this.fboSize, dt: this.options.dt, src: this.fbos.vel_0, dst: this.fbos.vel_1 });
      this.externalForce = new ExternalForce({ cellScale: this.cellScale, cursor_size: this.options.cursor_size, dst: this.fbos.vel_1 });
      this.viscous = new Viscous({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        viscous: this.options.viscous,
        src: this.fbos.vel_1,
        dst: this.fbos.vel_viscous1,
        dst_: this.fbos.vel_viscous0,
        dt: this.options.dt,
      });
      this.divergence = new Divergence({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.vel_viscous0, dst: this.fbos.div, dt: this.options.dt });
      this.poisson = new Poisson({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.div, dst: this.fbos.pressure_1, dst_: this.fbos.pressure_0 });
      this.pressure = new Pressure({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src_p: this.fbos.pressure_0,
        src_v: this.fbos.vel_viscous0,
        dst: this.fbos.vel_0,
        dt: this.options.dt,
      });
    }
    calcSize() {
      const w = Math.max(1, Math.round(this.options.resolution * common.width));
      const h = Math.max(1, Math.round(this.options.resolution * common.height));
      this.cellScale.set(1 / w, 1 / h);
      this.fboSize.set(w, h);
    }
    resize() {
      this.calcSize();
      (Object.keys(this.fbos) as Array<keyof Simulation["fbos"]>).forEach((key) => this.fbos[key].setSize(this.fboSize.x, this.fboSize.y));
    }
    update() {
      if (this.options.isBounce) this.boundarySpace.set(0, 0);
      else this.boundarySpace.copy(this.cellScale);
      this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC });
      this.externalForce.update({ cursor_size: this.options.cursor_size, mouse_force: this.options.mouse_force, cellScale: this.cellScale });
      let vel = this.fbos.vel_1;
      if (this.options.isViscous) {
        vel = this.viscous.update({ viscous: this.options.viscous, iterations: this.options.iterations_viscous, dt: this.options.dt });
      }
      this.divergence.update({ vel });
      const pressure = this.poisson.update({ iterations: this.options.iterations_poisson });
      this.pressure.update({ vel, pressure });
    }
  }

  class Output {
    simulation: Simulation;
    scene: THREE.Scene;
    camera: THREE.Camera;
    output: THREE.Mesh;

    constructor() {
      this.simulation = new Simulation({
        resolution: options.resolution,
        cursor_size: options.cursorSize,
        mouse_force: options.mouseForce,
        isViscous: options.isViscous,
        viscous: options.viscous,
        iterations_viscous: options.iterationsViscous,
        iterations_poisson: options.iterationsPoisson,
        dt: options.dt,
        isBounce: options.isBounce,
        BFECC: options.BFECC,
      });
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.output = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
          vertexShader: VERT_BOUNDARY_SPACE,
          fragmentShader: `
    precision highp float;
    uniform sampler2D velocity;
    uniform sampler2D palette;
    uniform vec4 bgColor;
    varying vec2 uv;
    void main(){
    vec2 vel = texture2D(velocity, uv).xy;
    float lenv = clamp(length(vel), 0.0, 1.0);
    vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
    gl_FragColor = vec4(c, lenv);
}
`,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: { value: this.simulation.fbos.vel_0.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTexture },
            bgColor: { value: bgColor },
          },
        }),
      );
      this.scene.add(this.output);
    }
    resize() {
      this.simulation.resize();
    }
    render() {
      common.renderer!.setRenderTarget(null);
      common.renderer!.render(this.scene, this.camera);
    }
    update() {
      this.simulation.update();
      this.render();
    }
  }

  class WebGLManagerImpl {
    lastUserInteraction = performance.now();
    autoDriver: AutoDriver;
    output: Output;
    running = false;
    private _loop = this.loop.bind(this);
    private _resize = this.resize.bind(this);
    private _onVisibility = () => {
      if (document.hidden) this.pause();
      else if (isVisible) this.start();
    };

    constructor(private container: HTMLElement) {
      common.init(container);
      mouse.init(container);
      mouse.autoIntensity = options.autoIntensity;
      mouse.takeoverDuration = options.takeoverDuration;
      mouse.onInteract = () => {
        this.lastUserInteraction = performance.now();
        this.autoDriver.forceStop();
      };
      this.autoDriver = new AutoDriver(mouse, this, {
        enabled: options.autoDemo,
        speed: options.autoSpeed,
        resumeDelay: options.autoResumeDelay,
        rampDuration: options.autoRampDuration,
      });
      container.prepend(common.renderer!.domElement);
      this.output = new Output();
      window.addEventListener("resize", this._resize);
      document.addEventListener("visibilitychange", this._onVisibility);
    }
    resize() {
      common.resize();
      this.output.resize();
    }
    render() {
      this.autoDriver.update();
      mouse.update();
      common.update();
      this.output.update();
    }
    loop() {
      if (this.running) {
        this.render();
        rafId = requestAnimationFrame(this._loop);
      }
    }
    start() {
      if (!this.running) {
        this.running = true;
        this._loop();
      }
    }
    pause() {
      this.running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
    dispose() {
      window.removeEventListener("resize", this._resize);
      document.removeEventListener("visibilitychange", this._onVisibility);
      mouse.dispose();
      if (common.renderer) {
        const el = common.renderer.domElement;
        el.parentNode?.removeChild(el);
        common.renderer.dispose();
        common.renderer.forceContextLoss();
      }
    }
  }

  // Only fall back to `relative` when the container is truly unpositioned.
  // Checking `container.style.position` (the inline attribute) instead of the
  // computed value would overwrite a `position: absolute` set via a
  // stylesheet class — like the "absolute inset-0" this component ships with
  // — collapsing it to an in-flow block with no defined height, which then
  // breaks percentage sizing on the canvas.
  if (getComputedStyle(container).position === "static") container.style.position = "relative";
  if (getComputedStyle(container).overflow === "visible") container.style.overflow = "hidden";
  const manager = new WebGLManagerImpl(container);
  manager.start();

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
      if (isVisible && !document.hidden) manager.start();
      else manager.pause();
    },
    { threshold: [0, 0.01, 0.1] },
  );
  io.observe(container);

  const ro = new ResizeObserver(() => manager.resize());
  ro.observe(container);

  return {
    dispose() {
      io.disconnect();
      ro.disconnect();
      manager.dispose();
    },
  };
}

/* React wrapper ------------------------------------------------------------ */

export function LiquidEther({
  className,
  colors,
  mouseForce = DEFAULTS.mouseForce,
  cursorSize = DEFAULTS.cursorSize,
  isViscous = DEFAULTS.isViscous,
  viscous = DEFAULTS.viscous,
  iterationsViscous = DEFAULTS.iterationsViscous,
  iterationsPoisson = DEFAULTS.iterationsPoisson,
  dt = DEFAULTS.dt,
  BFECC = DEFAULTS.BFECC,
  resolution = DEFAULTS.resolution,
  isBounce = DEFAULTS.isBounce,
  autoDemo = DEFAULTS.autoDemo,
  autoSpeed = DEFAULTS.autoSpeed,
  autoIntensity = DEFAULTS.autoIntensity,
  takeoverDuration = DEFAULTS.takeoverDuration,
  autoResumeDelay = DEFAULTS.autoResumeDelay,
  autoRampDuration = DEFAULTS.autoRampDuration,
}: Partial<LiquidEtherOptions> & { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Matches the `md:block` this component is always wrapped in on the site
    // (see hero.tsx): below that, skip the WebGL context and sim entirely
    // rather than create it and rely on the IntersectionObserver to pause a
    // `display: none` canvas — no allocation is cheaper than a paused one.
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const instance = createLiquidEther(container, {
      colors: colors ?? DEFAULTS.colors,
      mouseForce,
      cursorSize,
      isViscous,
      viscous,
      iterationsViscous,
      iterationsPoisson,
      dt,
      BFECC,
      resolution,
      isBounce,
      autoDemo,
      autoSpeed,
      autoIntensity,
      takeoverDuration,
      autoResumeDelay,
      autoRampDuration,
    });

    return () => instance.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options are read once at mount; changing them is not a supported live-update path here.
  }, []);

  return <div ref={containerRef} aria-hidden className={cn("absolute inset-0", className)} />;
}
