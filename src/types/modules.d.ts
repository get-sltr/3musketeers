/**
 * Type declarations for modules without @types packages
 */

declare module 'react-dom/client' {
  import { ReactNode } from 'react'
  
  export interface Root {
    render(children: ReactNode): void
    unmount(): void
  }
  
  export function createRoot(container: Element | DocumentFragment): Root
  export function hydrateRoot(container: Element | Document, initialChildren: ReactNode): Root
}

declare namespace mapboxgl {
  class Map {
    constructor(options?: any)
    on(type: string, listener: (...args: any[]) => void): this
    off(type: string, listener: (...args: any[]) => void): this
    getCanvas(): HTMLCanvasElement
    getContainer(): HTMLElement
    getCenter(): LngLat
    getZoom(): number
    getBounds(): LngLatBounds
    setCenter(center: any): this
    setZoom(zoom: number): this
    flyTo(options: any): this
    easeTo(options: any): this
    jumpTo(options: any): this
    addControl(control: any, position?: string): this
    removeControl(control: any): this
    addLayer(layer: any, before?: string): this
    removeLayer(id: string): this
    addSource(id: string, source: any): this
    removeSource(id: string): this
    getSource(id: string): any
    getLayer(id: string): any
    triggerRepaint(): void
    transform: any
    [key: string]: any
  }
  class Marker {
    constructor(options?: any)
    setLngLat(lnglat: any): this
    addTo(map: Map): this
    remove(): this
    getElement(): HTMLElement
    setPopup(popup: Popup): this
    [key: string]: any
  }
  class Popup {
    constructor(options?: any)
    setLngLat(lnglat: any): this
    setHTML(html: string): this
    addTo(map: Map): this
    remove(): this
    [key: string]: any
  }
  class LngLat {
    constructor(lng: number, lat: number)
    lng: number
    lat: number
    toArray(): [number, number]
    [key: string]: any
  }
  class LngLatBounds {
    constructor(sw?: any, ne?: any)
    extend(lnglat: any): this
    getCenter(): LngLat
    getSouthWest(): LngLat
    getNorthEast(): LngLat
    toArray(): [[number, number], [number, number]]
    [key: string]: any
  }
  class MercatorCoordinate {
    static fromLngLat(lnglat: any, altitude?: number): MercatorCoordinate
    x: number
    y: number
    z: number
    toLngLat(): LngLat
    toAltitude(): number
    meterInMercatorCoordinateUnits(): number
    [key: string]: any
  }
  class NavigationControl {
    constructor(options?: any)
  }
  class GeolocateControl {
    constructor(options?: any)
  }
  class ScaleControl {
    constructor(options?: any)
  }
  class FullscreenControl {
    constructor(options?: any)
  }
  let accessToken: string
  interface ErrorEvent {
    error?: Error
    message?: string
    [key: string]: any
  }
  interface MapboxEvent<T = any> {
    type: string
    target: Map
    originalEvent?: T
    [key: string]: any
  }
}

declare module 'mapbox-gl' {
  export default mapboxgl
  export import Map = mapboxgl.Map
  export import Marker = mapboxgl.Marker
  export import Popup = mapboxgl.Popup
  export import LngLat = mapboxgl.LngLat
  export import LngLatBounds = mapboxgl.LngLatBounds
  export import MercatorCoordinate = mapboxgl.MercatorCoordinate
  export import NavigationControl = mapboxgl.NavigationControl
  export import GeolocateControl = mapboxgl.GeolocateControl
  export import ScaleControl = mapboxgl.ScaleControl
  export import FullscreenControl = mapboxgl.FullscreenControl
}

declare module 'three' {
  export class Scene { [key: string]: any }
  export class Camera { [key: string]: any }
  export class PerspectiveCamera extends Camera { constructor(...args: any[]) }
  export class OrthographicCamera extends Camera { constructor(...args: any[]) }
  export class WebGLRenderer { constructor(options?: any); [key: string]: any }
  export class Mesh<G = any, M = any> { constructor(geometry?: G, material?: M); [key: string]: any }
  export class Group { [key: string]: any }
  export class Object3D { [key: string]: any }
  export class Vector2 { constructor(x?: number, y?: number); x: number; y: number; [key: string]: any }
  export class Vector3 { constructor(x?: number, y?: number, z?: number); x: number; y: number; z: number; [key: string]: any }
  export class Vector4 { constructor(x?: number, y?: number, z?: number, w?: number); [key: string]: any }
  export class Matrix4 { [key: string]: any }
  export class Quaternion { [key: string]: any }
  export class Euler { [key: string]: any }
  export class Color { constructor(color?: any); [key: string]: any }
  export class BufferGeometry { [key: string]: any }
  export class InstancedBufferGeometry extends BufferGeometry { [key: string]: any }
  export class BufferAttribute { constructor(array: any, itemSize: number, normalized?: boolean); [key: string]: any }
  export class InstancedBufferAttribute extends BufferAttribute { [key: string]: any }
  export class Float32BufferAttribute extends BufferAttribute { [key: string]: any }
  export class MeshBasicMaterial { constructor(params?: any); [key: string]: any }
  export class MeshStandardMaterial { constructor(params?: any); [key: string]: any }
  export class MeshPhongMaterial { constructor(params?: any); [key: string]: any }
  export class ShaderMaterial { constructor(params?: any); [key: string]: any }
  export class RawShaderMaterial extends ShaderMaterial { [key: string]: any }
  export class LineBasicMaterial { constructor(params?: any); [key: string]: any }
  export class PointsMaterial { constructor(params?: any); [key: string]: any }
  export class SpriteMaterial { constructor(params?: any); [key: string]: any }
  export class BoxGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class SphereGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class PlaneGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class CylinderGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class ConeGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class CircleGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class RingGeometry extends BufferGeometry { constructor(...args: any[]) }
  export class AmbientLight { constructor(...args: any[]); [key: string]: any }
  export class DirectionalLight { constructor(...args: any[]); [key: string]: any }
  export class PointLight { constructor(...args: any[]); [key: string]: any }
  export class SpotLight { constructor(...args: any[]); [key: string]: any }
  export class HemisphereLight { constructor(...args: any[]); [key: string]: any }
  export class TextureLoader { load(url: string, onLoad?: any, onProgress?: any, onError?: any): Texture; [key: string]: any }
  export class Texture { [key: string]: any }
  export class CanvasTexture extends Texture { constructor(canvas: any); [key: string]: any }
  export class Raycaster { [key: string]: any }
  export class Clock { [key: string]: any }
  export class AnimationMixer { [key: string]: any }
  export const DoubleSide: number
  export const FrontSide: number
  export const BackSide: number
  export const AdditiveBlending: number
  export const NormalBlending: number
  export const GLSL3: string
  export const LinearFilter: number
  export const NearestFilter: number
  export const ClampToEdgeWrapping: number
  export const RepeatWrapping: number
  export const MirroredRepeatWrapping: number
}

declare module 'supercluster' {
  export interface Options<P, C> {
    minZoom?: number
    maxZoom?: number
    minPoints?: number
    radius?: number
    extent?: number
    nodeSize?: number
    log?: boolean
    generateId?: boolean
    map?: (props: P) => C
    reduce?: (accumulated: C, props: C) => void
  }

  export interface PointFeature<P> {
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: P
  }

  export interface ClusterProperties {
    cluster: true
    cluster_id: number
    point_count: number
    point_count_abbreviated: string | number
  }

  export interface ClusterFeature<C> {
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: ClusterProperties & C
  }

  export default class Supercluster<P = any, C = any> {
    constructor(options?: Options<P, C>)
    load(points: Array<PointFeature<P>>): Supercluster<P, C>
    getClusters(bbox: [number, number, number, number], zoom: number): Array<ClusterFeature<C> | PointFeature<P>>
    getTile(z: number, x: number, y: number): any
    getClusterExpansionZoom(clusterId: number): number
    getLeaves(clusterId: number, limit?: number, offset?: number): Array<PointFeature<P>>
    getChildren(clusterId: number): Array<ClusterFeature<C> | PointFeature<P>>
  }
}

declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: any): Promise<void>
  export function toString(text: string, options?: any): Promise<string>
}
