'use client'

import * as THREE from 'three'
import mapboxgl, { MercatorCoordinate } from 'mapbox-gl'
import { Pin } from '@/types/pins'

export type LOD = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW'

export class HoloPinsLayer {
  id = 'holo-pins-layer'
  type: 'custom' = 'custom'
  renderingMode: '3d' = '3d'

  private map?: mapboxgl.Map
  private scene!: THREE.Scene
  private camera!: THREE.Camera
  private renderer!: any
  private material!: THREE.RawShaderMaterial
  private mesh!: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.RawShaderMaterial>

  private pins: Pin[] = []
  private lod: LOD = 'ULTRA'

  constructor(pins: Pin[] = []) {
    this.pins = pins
  }

  setData(pins: Pin[]) {
    this.pins = pins
    console.log('🔄 HoloPinsLayer.setData called with', pins.length, 'pins')
    this._updateInstances()
  }

  setLOD(lod: LOD) {
    this.lod = lod
    if (!this.material) return
    const mat = this.material as any
    mat.uniforms.u_lod.value = this._lodToFloat(lod)
  }

  setOptions(opts: { partyMode?: number; prideMonth?: number }) {
    if (!this.material) return
    const mat = this.material as any
    if (typeof opts.partyMode === 'number') mat.uniforms.u_partyMode.value = opts.partyMode
    if (typeof opts.prideMonth === 'number') mat.uniforms.u_prideMonth.value = opts.prideMonth
  }

  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.map = map
    this.scene = new THREE.Scene()
    this.camera = new THREE.Camera()

    // Inline shader sources to avoid loader requirements
    const vertSrc = `precision highp float;

attribute vec3 position;
attribute vec2 uv;

attribute vec3 instanceOffset; // mercator world units
attribute float instanceSize;
attribute float instanceStatus; // 0=online,1=away,2=dtfn,3=offline
attribute float instancePremium; // 0,1,2
attribute float instanceBadge;   // 0 none,1 DTFN,2 NOW
attribute float instanceSeed;    // 0..1
attribute float instanceClusterSize; // 0 for user pin; >0 for clusters

uniform mat4 u_matrix; // mapbox-provided camera * projection
uniform float u_time;

varying vec2 vUv;
varying float vStatus;
varying float vPremium;
varying float vBadge;
varying float vSeed;
varying float vClusterSize;

void main() {
  vUv = uv;
  vStatus = instanceStatus;
  vPremium = instancePremium;
  vBadge = instanceBadge;
  vSeed = instanceSeed;
  vClusterSize = instanceClusterSize;

  // Billboard quad centered at instanceOffset
  float clusterScale = 1.0 + clamp(log(1.0 + instanceClusterSize) / log(100.0), 0.0, 1.0) * 1.6;
  vec3 pos = position * instanceSize * clusterScale;
  vec4 world = vec4(instanceOffset + pos, 1.0);
  gl_Position = u_matrix * world;
}`

    const fragSrc = `precision highp float;

varying vec2 vUv;
varying float vStatus;
varying float vPremium;
varying float vBadge;
varying float vSeed;
varying float vClusterSize;

uniform float u_time;
uniform float u_partyMode; // 0..1
uniform float u_prideMonth; // 0..1
uniform float u_lod; // 0 ULTRA..3 LOW

// Simple pseudo-noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x)+ (d-b)*u.x*u.y;
}

vec3 hsv2rgb(vec3 c){
  vec3 p = abs(fract(c.x + vec3(0., 2./3., 1./3.)) * 6. - 3.);
  return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y);
}

void main(){
  // Soft circular mask
  vec2 uv = vUv * 2.0 - 1.0;
  float r = length(uv);
  float mask = smoothstep(1.0, 0.9, r);

  // Enhanced liquid morphing animation with multiple frequencies
  float wobbleAmp = mix(0.15, 0.05, step(2.0, u_lod));
  float wobble1 = (noise(uv*3.0 + vSeed*10.0 + u_time*0.8) - 0.5) * wobbleAmp;
  float wobble2 = (noise(uv*5.0 + vSeed*7.0 + u_time*1.2) - 0.5) * wobbleAmp * 0.6;
  float wobble3 = (noise(uv*7.0 + vSeed*3.0 + u_time*0.5) - 0.5) * wobbleAmp * 0.3;
  float wobble = wobble1 + wobble2 + wobble3;
  
  // Morphing liquid shape with smooth transitions
  float morph = smoothstep(0.88+wobble, 0.2+wobble, r);
  float body = morph * (1.0 + sin(u_time*2.0 + vSeed*10.0) * 0.05);

  // Spinning rainbow holographic border with enhanced rotation
  float angle = atan(uv.y, uv.x) / 6.28318 + 0.5 + u_time*0.15; // Faster spin
  float hue = fract(angle + u_partyMode*0.2 + u_prideMonth*0.3);
  float rim = smoothstep(0.98, 0.75, r) * (1.0 + u_prideMonth*0.5);
  
  // Enhanced rainbow effect with multiple bands
  float rim2 = smoothstep(0.95, 0.85, r) * 0.6;
  float rim3 = smoothstep(0.92, 0.82, r) * 0.4;
  
  // Cluster hue boost based on size
  hue += clamp(log(1.0 + vClusterSize) / 8.0, 0.0, 0.25);
  vec3 rimColor = hsv2rgb(vec3(hue, 0.9 + clamp(vClusterSize*0.01, 0.0, 0.1), 1.0));
  vec3 rimColor2 = hsv2rgb(vec3(hue + 0.1, 0.85, 1.0));
  vec3 rimColor3 = hsv2rgb(vec3(hue + 0.2, 0.8, 1.0));

  // Status dots (green/orange/red) - rendered as small dots at top
  vec3 statusDotColor = vec3(0.0);
  float statusDot = 0.0;
  if (vStatus < 0.5) {
    // Online - green
    statusDotColor = vec3(0.0, 1.0, 0.4);
    float dotPos = length(uv - vec2(0.0, 0.7));
    statusDot = smoothstep(0.12, 0.08, dotPos) * smoothstep(0.06, 0.08, dotPos);
  } else if (vStatus < 1.5) {
    // Away - orange
    statusDotColor = vec3(1.0, 0.5, 0.0);
    float dotPos = length(uv - vec2(0.0, 0.7));
    statusDot = smoothstep(0.12, 0.08, dotPos) * smoothstep(0.06, 0.08, dotPos);
  } else if (vStatus < 2.5) {
    // DTFN - red pulsing
    statusDotColor = vec3(1.0, 0.1, 0.1);
    float dotPos = length(uv - vec2(0.0, 0.7));
    float pulse = sin(u_time * 6.0) * 0.5 + 0.5;
    statusDot = smoothstep(0.12, 0.08, dotPos) * smoothstep(0.06, 0.08, dotPos) * (1.0 + pulse * 0.5);
  } else {
    // Offline - gray
    statusDotColor = vec3(0.4, 0.4, 0.4);
    float dotPos = length(uv - vec2(0.0, 0.7));
    statusDot = smoothstep(0.12, 0.08, dotPos) * smoothstep(0.06, 0.08, dotPos) * 0.5;
  }

  // Status coloring boost
  vec3 statusColor = vec3(0.6);
  if (vStatus < 0.5) statusColor = vec3(0.0, 1.0, 0.6);       // online
  else if (vStatus < 1.5) statusColor = vec3(1.0, 0.6, 0.0);  // away
  else if (vStatus < 2.5) statusColor = vec3(1.0, 0.1, 0.1);  // dtfn
  else statusColor = vec3(0.3, 0.5, 0.7);                     // offline

  float rimGlow = rim + rim2 * 0.6 + rim3 * 0.4;

  // DTFN urgency pulse
  if (vStatus > 1.5 && vStatus < 2.5) {
    float urgency = sin(u_time * 8.0) * 0.5 + 0.5;
    rimGlow *= mix(1.0, 3.5, urgency);
    rimColor = mix(rimColor, vec3(1.0, 0.0, 0.0), urgency * 0.7);
  }

  // Base glass color with enhanced glassmorphism
  vec3 glass = mix(vec3(0.08,0.1,0.12), statusColor*0.25, 0.3);
  vec3 glassInner = mix(glass, vec3(0.15, 0.18, 0.22), 0.4);
  float glassFresnel = smoothstep(0.7, 0.3, r);
  vec3 color = mix(glassInner, glass, glassFresnel) * body + rimColor * rimGlow + rimColor2 * rim2 + rimColor3 * rim3;

  // Premium/founder golden effects with enhanced sparkles
  if (vPremium > 0.5 && u_lod < 2.5) {
    float tw = step(0.995, noise(uv*18.0 + u_time*1.5 + vSeed*5.0));
    float tw2 = step(0.99, noise(uv*25.0 + u_time*2.0 + vSeed*3.0)) * 0.6;
    vec3 gold = vec3(1.0, 0.843, 0.0);
    vec3 goldGlow = vec3(1.0, 0.9, 0.5);
    color += gold * tw * (vPremium > 1.5 ? 2.5 : 1.5);
    color += goldGlow * tw2 * (vPremium > 1.5 ? 1.5 : 1.0);
    
    // Golden border for premium users
    float goldRim = smoothstep(0.96, 0.92, r);
    color += goldGlow * goldRim * (vPremium > 1.5 ? 1.2 : 0.8);
  }

  // DTFN/NOW badges below pins (rendered at bottom)
  if (vBadge > 0.5 && uv.y < -0.75 && abs(uv.x) < 0.5) {
    float bmask = smoothstep(0.15, 0.0, abs(uv.y + 0.85));
    float bmask2 = smoothstep(0.12, 0.0, abs(uv.x));
    float badgeMask = bmask * bmask2;
    float bhue = vBadge < 1.5 ? 0.0 : 0.55; // DTFN red, NOW teal
    vec3 badgeColor = hsv2rgb(vec3(bhue, 0.8, 1.0));
    float badgeGlow = sin(u_time * 4.0 + vSeed * 5.0) * 0.3 + 0.7;
    color += badgeColor * badgeMask * 0.8 * badgeGlow;
    
    // Badge text glow
    if (abs(uv.x) < 0.3 && abs(uv.y + 0.85) < 0.05) {
      color += badgeColor * 1.5 * badgeGlow;
    }
  }

  // Add status dot
  color += statusDotColor * statusDot;

  color *= mask;
  if (mask < 0.01) discard;
  gl_FragColor = vec4(color, 0.92 + vPremium * 0.08); // Slightly more opaque for premium
}`

    this.material = new THREE.RawShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      uniforms: {
        u_matrix: { value: new THREE.Matrix4() },
        u_time: { value: 0 },
        u_partyMode: { value: 0 },
        u_prideMonth: { value: 0 },
        u_lod: { value: this._lodToFloat(this.lod) },
      },
    })

    // Build instanced geometry from a plane
    const plane = new THREE.PlaneGeometry(1, 1)
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.index = plane.index
    geometry.attributes = plane.attributes

    // Per-instance attributes
    const count = Math.max(1, this.pins.length)
    const offsets = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const status = new Float32Array(count)
    const premium = new Float32Array(count)
    const badge = new Float32Array(count)
    const seed = new Float32Array(count)
    const clusterSize = new Float32Array(count)

    geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geometry.setAttribute('instanceSize', new THREE.InstancedBufferAttribute(sizes, 1))
    geometry.setAttribute('instanceStatus', new THREE.InstancedBufferAttribute(status, 1))
    geometry.setAttribute('instancePremium', new THREE.InstancedBufferAttribute(premium, 1))
    geometry.setAttribute('instanceBadge', new THREE.InstancedBufferAttribute(badge, 1))
    geometry.setAttribute('instanceSeed', new THREE.InstancedBufferAttribute(seed, 1))
    geometry.setAttribute('instanceClusterSize', new THREE.InstancedBufferAttribute(clusterSize, 1))
    geometry.instanceCount = count

    const mesh = new THREE.Mesh(geometry, this.material)
    ;(mesh.frustumCulled as boolean) = false

    this.mesh = mesh as any
    this.scene.add(mesh)

    // Use Mapbox GL context
    this.renderer = new (THREE as any).WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
    this.renderer.autoClear = false

    this._updateInstances()
  }

  render(gl: WebGLRenderingContext, matrix: number[]) {
    if (this.pins.length === 0) return // Skip rendering if no pins
    
    const m = new THREE.Matrix4().fromArray(matrix)
    const mat = this.material as any
    mat.uniforms.u_matrix.value = m
    mat.uniforms.u_time.value = performance.now() / 1000

    const r = (this.renderer as any)
    r.state.reset()
    this.renderer.render(this.scene, this.camera)
  }

  private _updateInstances() {
    if (!this.mesh || !this.map) return

    const geom = this.mesh.geometry as unknown as THREE.InstancedBufferGeometry as any
    const offsets: Float32Array = geom.getAttribute('instanceOffset').array
    const sizes: Float32Array = geom.getAttribute('instanceSize').array
    const status: Float32Array = geom.getAttribute('instanceStatus').array
    const premium: Float32Array = geom.getAttribute('instancePremium').array
    const badge: Float32Array = geom.getAttribute('instanceBadge').array
    const seed: Float32Array = geom.getAttribute('instanceSeed').array
    const cluster: Float32Array = geom.getAttribute('instanceClusterSize').array

    const count = this.pins.length
    geom.instanceCount = Math.max(1, count)

    for (let i = 0; i < count; i++) {
      const p = this.pins[i]!
      const mc = MercatorCoordinate.fromLngLat([p.lng, p.lat], 0)
      const x = mc.x, y = mc.y, z = mc.z || 0
      offsets[i * 3 + 0] = x
      offsets[i * 3 + 1] = y
      offsets[i * 3 + 2] = z

      // Size in mercator units: approximate 24-40 px depending on zoom will be handled by shader via matrix scaling
      sizes[i] = 0.02 // tuned visually

      status[i] = this._statusToFloat(p.status)
      premium[i] = p.premiumTier ?? 0
      badge[i] = this._badgeToFloat(p.badge)
      seed[i] = (i * 9301.0 + 49297.0) - Math.floor((i * 9301.0 + 49297.0))
      cluster[i] = p.clusterSize ? Math.max(0, p.clusterSize) : 0
    }

    geom.getAttribute('instanceOffset').needsUpdate = true
    geom.getAttribute('instanceSize').needsUpdate = true
    geom.getAttribute('instanceStatus').needsUpdate = true
    geom.getAttribute('instancePremium').needsUpdate = true
    geom.getAttribute('instanceBadge').needsUpdate = true
    geom.getAttribute('instanceSeed').needsUpdate = true
  }

  private _statusToFloat(s?: Pin['status']) {
    switch (s) {
      case 'online': return 0
      case 'away': return 1
      case 'dtfn': return 2
      case 'offline': return 3
      default: return 3
    }
  }
  private _badgeToFloat(b?: Pin['badge']) {
    switch (b) {
      case 'DTFN': return 1
      case 'NOW': return 2
      default: return 0
    }
  }
  private _lodToFloat(l: LOD) {
    switch (l) {
      case 'ULTRA': return 0.0
      case 'HIGH': return 1.0
      case 'MEDIUM': return 2.0
      case 'LOW': return 3.0
    }
  }
}