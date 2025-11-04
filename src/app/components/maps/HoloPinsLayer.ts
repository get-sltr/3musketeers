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
    this._updateInstances()
  }

  setLOD(lod: LOD) {
    this.lod = lod
    if (!this.material) return
    const mat = this.material as any
    mat.uniforms.u_lod.value = this._lodToFloat(lod)
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

uniform mat4 u_matrix; // mapbox-provided camera * projection
uniform float u_time;

varying vec2 vUv;
varying float vStatus;
varying float vPremium;
varying float vBadge;
varying float vSeed;

void main() {
  vUv = uv;
  vStatus = instanceStatus;
  vPremium = instancePremium;
  vBadge = instanceBadge;
  vSeed = instanceSeed;

  // Billboard quad centered at instanceOffset
  vec3 pos = position * instanceSize;
  vec4 world = vec4(instanceOffset + pos, 1.0);
  gl_Position = u_matrix * world;
}`

    const fragSrc = `precision highp float;

varying vec2 vUv;
varying float vStatus;
varying float vPremium;
varying float vBadge;
varying float vSeed;

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

  // Liquid wobble
  float wobbleAmp = mix(0.12, 0.04, step(2.0, u_lod));
  float wobble = (noise(uv*3.0 + vSeed*10.0 + u_time*0.8) - 0.5) * wobbleAmp;
  float body = smoothstep(0.9+wobble, 0.2+wobble, r);

  // Holographic rim
  float angle = atan(uv.y, uv.x) / 6.28318 + 0.5 + u_time*0.05;
  float hue = fract(angle + u_partyMode*0.2);
  float rim = smoothstep(0.95, 0.8, r) * (1.0 + u_prideMonth*0.5);
  vec3 rimColor = hsv2rgb(vec3(hue, 0.8, 1.0));

  // Status coloring boost
  vec3 statusColor = vec3(0.6);
  if (vStatus < 0.5) statusColor = vec3(0.0, 1.0, 0.6);       // online
  else if (vStatus < 1.5) statusColor = vec3(1.0, 0.6, 0.0);  // away
  else if (vStatus < 2.5) statusColor = vec3(1.0, 0.1, 0.1);  // dtfn
  else statusColor = vec3(0.3, 0.5, 0.7);                     // offline

  float rimGlow = rim;

  // DTFN urgency pulse
  if (vStatus > 1.5 && vStatus < 2.5) {
    float urgency = sin(u_time * 8.0) * 0.5 + 0.5;
    rimGlow *= mix(1.0, 3.0, urgency);
    rimColor = mix(rimColor, vec3(1.0, 0.0, 0.0), urgency);
  }

  // Base glass color
  vec3 glass = mix(vec3(0.08,0.1,0.12), statusColor*0.25, 0.3);
  vec3 color = glass * body + rimColor * rimGlow;

  // Premium/founder sparkles
  if (vPremium > 0.5 && u_lod < 2.5) {
    float tw = step(0.995, noise(uv*18.0 + u_time*1.5 + vSeed*5.0));
    vec3 gold = vec3(1.0, 0.843, 0.0);
    color += gold * tw * (vPremium > 1.5 ? 2.0 : 1.0);
  }

  // Badge underlay hint (simple strip)
  if (vBadge > 0.5 && uv.y < -0.6 && abs(uv.x) < 0.6) {
    float bmask = smoothstep(0.08, 0.0, abs(uv.y + 0.8));
    float bhue = vBadge < 1.5 ? 0.0 : 0.55; // DTFN red, NOW teal
    color += hsv2rgb(vec3(bhue, 0.7, 1.0)) * bmask * 0.6;
  }

  color *= mask;
  if (mask < 0.01) discard;
  gl_FragColor = vec4(color, 0.9);
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

    geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geometry.setAttribute('instanceSize', new THREE.InstancedBufferAttribute(sizes, 1))
    geometry.setAttribute('instanceStatus', new THREE.InstancedBufferAttribute(status, 1))
    geometry.setAttribute('instancePremium', new THREE.InstancedBufferAttribute(premium, 1))
    geometry.setAttribute('instanceBadge', new THREE.InstancedBufferAttribute(badge, 1))
    geometry.setAttribute('instanceSeed', new THREE.InstancedBufferAttribute(seed, 1))
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