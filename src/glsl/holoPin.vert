precision highp float;

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
}