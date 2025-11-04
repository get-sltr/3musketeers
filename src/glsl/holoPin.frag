precision highp float;

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
}