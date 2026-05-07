import {
  Fn, If, texture, uniform, vec2, vec3, vec4, float,
  screenUV, screenSize, mix, floor, normalize,
  smoothstep, fract, sin, dot, max, abs,
} from 'three/tsl'
import { Vector2 } from 'three'

export function createPostNode(sceneTexture: any) {
  const uIntensity = uniform(0)
  const uBloom = uniform(0)
  const uVelocityDir = uniform(new Vector2(0, 0))
  const uPixelSize = uniform(150)
  const uCaOffset = uniform(0.04)

  const node = Fn(() => {
    const uv = screenUV
    const res = screenSize
    const i: any = uIntensity
    const velDir: any = uVelocityDir
    const px: any = uPixelSize
    const caOff: any = uCaOffset

    // pixelation
    const size = float(1.0).add(i.mul(px))
    const quantized = floor(uv.mul(res).div(size) as any).mul(size).div(res)
    const puv = (quantized as any).add(float(0.5).div(res))

    // chromatic aberration
    const ca = i.mul(caOff)
    const dir = normalize(velDir) as any
    const r = texture(sceneTexture, (puv as any).add(dir.mul(ca))).r
    const g = texture(sceneTexture, puv).g
    const b = texture(sceneTexture, (puv as any).sub(dir.mul(ca))).b
    let color = vec4(r, g, b, float(1.0))

    // brightness boost
    ;(color as any).rgb.assign((color as any).rgb.mul(float(1.0).add(i.mul(0.5))))

    // edge particle dissolve
    const dx = abs((uv as any).x.sub(0.5)).mul(2.0)
    const dy = abs((uv as any).y.sub(0.5)).mul(2.0)
    const edgeDist = max(dx, dy)
    const edgeMask = smoothstep(0.4, 0.8, edgeDist)
    const edgeStr = (edgeMask as any).mul(i)

    If(edgeStr.greaterThan(0.001), () => {
      const h = fract(sin(dot(uv, vec2(127.1, 311.7))).mul(43758.5453))
      const h2 = fract(sin(dot((uv as any).add(17.0), vec2(269.5, 183.3))).mul(43758.5453))
      const scatter = vec2((h as any).sub(0.5), (h2 as any).sub(0.5)).mul(edgeStr).mul(0.12)
      const particleCol = texture(sceneTexture, (puv as any).add(scatter)).rgb
      ;(color as any).rgb.assign(mix((color as any).rgb, particleCol, edgeStr))
    })

    // bloom
    If(uBloom.greaterThan(0.001), () => {
      const step: any = vec2(
        float(1.0).div(res.x),
        float(1.0).div(res.y),
      ).mul(float(3.0).add((uBloom as any).mul(40.0)))

      let blur: any = vec3(0.0)
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(step.x.negate(), step.y))).rgb)
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(0, step.y))).rgb.mul(2.0))
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(step.x, step.y))).rgb)
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(step.x.negate(), 0))).rgb.mul(2.0))
      blur.addAssign(texture(sceneTexture, puv).rgb.mul(4.0))
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(step.x, 0))).rgb.mul(2.0))
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(step.x.negate(), step.y.negate()))).rgb)
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(0, step.y.negate()))).rgb.mul(2.0))
      blur.addAssign(texture(sceneTexture, (puv as any).add(vec2(step.x, step.y.negate()))).rgb)
      blur.divAssign(16.0)
      ;(color as any).rgb.assign(mix((color as any).rgb, blur, (uBloom as any).mul(1.0)))
    })

    return color
  })()

  return { node, uIntensity, uBloom, uVelocityDir, uPixelSize, uCaOffset }
}
