import { useEffect, useRef } from "react";
import {
  Color,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import gsap from "gsap";

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// A banknote-style guilloche rosette: two families of wave rings, one in ink and one in tint.
// Each ring is r = base + w(angle). Its pixel distance uses the analytic gradient
// sqrt(1 + (w'(a) / r)^2) rather than fwidth(), which some GPUs and software renderers return as 0.
const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uDraw;
  uniform float uLobes;
  uniform float uPhase;
  uniform float uRings;
  uniform vec3 uInk;
  uniform vec3 uTint;

  float ring(float d, float slope, float scale, float width) {
    float px = abs(d) * scale / sqrt(1.0 + slope * slope);
    return 1.0 - smoothstep(width, width + 1.0, px);
  }

  void main() {
    float scale = 0.5 * min(uRes.x, uRes.y);
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
    float r = max(length(p) * 2.0, 1e-3);
    float a = atan(p.y, p.x);
    float L = uLobes;
    float L2 = L * 2.0 + 1.0;
    float L3 = L + 3.0;
    float L6 = L + 6.0;
    float inkA = 0.0;
    float tintA = 0.0;

    for (int i = 0; i < 22; i++) {
      if (float(i) >= uRings) break;
      float f = float(i) / (uRings - 1.0);
      float on = step(f, uDraw);
      float base = 0.36 + f * 0.5;

      float p1 = L * a + f * 6.2832 + uTime * 0.12 + uPhase;
      float p2 = L2 * a - f * 3.1416 - uTime * 0.08;
      float w = 0.042 * sin(p1) + 0.011 * sin(p2);
      float dw = 0.042 * L * cos(p1) + 0.011 * L2 * cos(p2);
      inkA = max(inkA, on * ring(r - base - w, dw / r, scale, 0.35));

      float q1 = L * a - f * 6.2832 - uTime * 0.1 - uPhase;
      float q2 = L3 * a + uTime * 0.05;
      float t = 0.036 * sin(q1) + 0.014 * sin(q2);
      float dt = 0.036 * L * cos(q1) + 0.014 * L3 * cos(q2);
      tintA = max(tintA, on * ring(r - base - 0.012 - t, dt / r, scale, 0.5));
    }

    float inner = ceil(uRings * 0.4);
    for (int i = 0; i < 9; i++) {
      if (float(i) >= inner) break;
      float f = float(i) / max(inner - 1.0, 1.0);
      float on = step(f, uDraw);
      float s1 = L6 * a + f * 3.1416 + uPhase * 0.5;
      float w = 0.03 * sin(s1);
      float dw = 0.03 * L6 * cos(s1);
      inkA = max(inkA, on * 0.8 * ring(r - 0.14 - f * 0.17 - w, dw / r, scale, 0.4));
    }

    float edge = (1.0 - smoothstep(0.9, 0.99, r)) * smoothstep(0.06, 0.1, r);
    inkA *= 0.92 * edge;
    tintA *= 0.85 * edge * (1.0 - inkA);
    float alpha = inkA + tintA;
    gl_FragColor = vec4(uInk * inkA + uTint * tintA, alpha);
  }
`;

/**
 * seed shapes the rosette (e.g. a payroll total), so each payroll prints its own pattern.
 * controlRef, when given, receives the shader uniforms so a parent can shift uPhase
 * from pointer input without re-rendering React.
 */
export default function Guilloche({ seed = 4580, ink = "#1c2333", tint = "#3d6e3a", controlRef, className, label }) {
  const holder = useRef(null);

  useEffect(() => {
    const el = holder.current;
    let renderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return undefined; // no WebGL: the page reads fine without the rosette
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    el.appendChild(renderer.domElement);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const uniforms = {
      uRes: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uDraw: { value: reduce ? 1 : 0 },
      uLobes: { value: 9 + (Math.round(seed) % 7) },
      uPhase: { value: (seed % 360) * 0.0174 },
      uRings: { value: 22 },
      uInk: { value: new Color(ink) },
      uTint: { value: new Color(tint) },
    };
    if (controlRef) controlRef.current = uniforms;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, blending: NoBlending });
    const mesh = new Mesh(new PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      // Keep roughly 14 CSS px between rings so small rosettes stay open instead of filling in.
      uniforms.uRings.value = Math.max(6, Math.min(22, Math.round(Math.min(width, height) / 28)));
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.getDrawingBufferSize(uniforms.uRes.value);
      renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const draw = reduce ? null : gsap.to(uniforms.uDraw, { value: 1, duration: 2.6, ease: "none", delay: 0.2 });

    // Only spend frames while the rosette is on screen.
    let visible = false;
    const tick = (time) => {
      if (!reduce) uniforms.uTime.value = time / 1000;
      renderer.render(scene, camera);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      renderer.setAnimationLoop(visible ? tick : null);
    });
    io.observe(el);

    return () => {
      io.disconnect();
      ro.disconnect();
      draw?.kill();
      renderer.setAnimationLoop(null);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (controlRef) controlRef.current = null;
    };
  }, [seed, ink, tint, controlRef]);

  return <div ref={holder} className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}
