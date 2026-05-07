import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn, uniform, float, vec2, vec3, vec4, sin, dot,
  smoothstep, fract, exp, length, positionLocal, time,
} from 'three/tsl'

export class Orb {
  mesh: THREE.Mesh
  private mat: NodeMaterial
  private uColor: any

  constructor(x: number, y: number, z: number) {
    const uTime = time
    this.uColor = uniform(new THREE.Color(0x9b6bff))

    const fragNode = Fn(() => {
      const p: any = positionLocal
      const col: any = this.uColor
      const t = uTime as any

      const d = length(p.xy).mul(1.2)
      const glow = exp(d.negate().mul(1.2)).mul(1.2)
      const pulse = float(1.0).add(sin(t.mul(2.0).add(d.mul(5.0))).mul(0.2))
      const h = fract(sin(dot(p.xy.mul(50.0).add(t), vec2(12.9898, 78.233))).mul(43758.5453))
      const sparkle = smoothstep(0.85, 1.0, h)
      const alpha = glow.mul(pulse).add(sparkle.mul(0.4))
      const sparkCol = vec3(col.r, col.g, col.b).mul(float(1.0).add(sparkle.mul(0.5)))
      return vec4(sparkCol.r, sparkCol.g, sparkCol.b, alpha)
    })()

    const geo = new THREE.SphereGeometry(2.5, 64, 64)
    this.mat = new NodeMaterial()
    this.mat.colorNode = fragNode
    this.mat.transparent = true
    this.mat.blending = THREE.AdditiveBlending
    this.mat.depthWrite = false
    this.mat.depthTest = false

    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.renderOrder = 999
    this.mesh.position.set(x, y, z)
  }

  setColor(hex: string | number) {
    this.uColor.value.set(hex)
  }
}
