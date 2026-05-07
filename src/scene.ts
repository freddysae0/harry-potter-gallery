import * as THREE from 'three'
import { WebGPURenderer, RenderPipeline } from 'three/webgpu'
import { pass, renderOutput } from 'three/tsl'
import GUI from 'lil-gui'
import { Gallery } from './gallery'
import { store } from './store'
import { createPostNode } from './post'
import { Orb } from './orb'

export class Scene {
  private renderer!: WebGPURenderer
  private renderPipeline!: RenderPipeline
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private animationId: number | null = null
  private gallery!: Gallery
  private orb!: Orb
  private orb2!: Orb
  private gui!: GUI

  // Drag state
  private dragging = false
  private prevX = 0
  private prevY = 0
  private velocityX = 0
  private velocityY = 0

  // Camera pan (absolute coords in infinite space)
  private panX = (Math.random() - 0.5) * 30
  private panY = (Math.random() - 0.5) * 20
  private targetPanX = this.panX
  private targetPanY = this.panY

  private defaultDistance = 22
  private minDistance = this.defaultDistance / 10
  private maxDistance = this.defaultDistance
  private distance = this.defaultDistance / 3.5
  private targetDistance = this.defaultDistance / 3.5

  private zoomHud = document.getElementById('zoom-hud')
  private bloomIntensity = 0
  private meshRotX = 0
  private meshRotY = 0
  private targetMeshRotX = 0
  private targetMeshRotY = 0

  private postU!: ReturnType<typeof createPostNode>

  // GUI tweakable
  private guiParams = {
    intensity: 1.0,
    bloom: 1.0,
    pixelSize: 150,
    caOffset: 0.04,
    rotSpeed: 0.36,
    orbColor: '#9b6bff',
  }

  // Infinite tiling
  private tiles: THREE.Group[] = []
  private cellX = 0
  private cellY = 0
  private tiled = false

  static async create(container: HTMLElement) {
    const s = new Scene()
    await s.init(container)
    return s
  }

  private async init(container: HTMLElement) {
    this.renderer = new WebGPURenderer({ antialias: true })
    await this.renderer.init()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0e0a14)

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    )

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 0.8)
    this.scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xc8b4ff, 1.2)
    dirLight.position.set(10, 15, 20)
    this.scene.add(dirLight)
    const pointLight = new THREE.PointLight(0x9b6bff, 2, 30)
    pointLight.position.set(0, 0, 10)
    this.scene.add(pointLight)

    // Orbs (visible ShaderMaterial objects via NodeMaterial)
    this.orb = new Orb(-4, 0, 1.5)
    this.orb2 = new Orb(4, 0, 1.5)
    this.scene.add(this.orb.mesh)
    this.scene.add(this.orb2.mesh)

    this.gallery = new Gallery()
    this.gallery.load()

    // GUI
    this.gui = new GUI({ title: 'Controls' })
    const fxFolder = this.gui.addFolder('Effects (on drag)')
    fxFolder.add(this.guiParams, 'intensity', 0, 3, 0.01).name('FX Intensity')
    fxFolder.add(this.guiParams, 'bloom', 0, 2, 0.01).name('Bloom (zoom)')
    fxFolder.add(this.guiParams, 'pixelSize', 0, 300, 1).name('Pixelation')
    fxFolder.add(this.guiParams, 'caOffset', 0, 0.1, 0.001).name('Chromatic Aberration')
    fxFolder.add(this.guiParams, 'rotSpeed', 0, 1, 0.01).name('Tilt on drag')

    const orbFolder = this.gui.addFolder('Orb (ShaderMaterial)')
    orbFolder.addColor(this.guiParams, 'orbColor').name('Orb Color')

    const helpFolder = this.gui.addFolder('Shortcuts')
    helpFolder.add({ r: 'R = reset camera' }, 'r').disable()
    helpFolder.add({ h: 'H = toggle panel' }, 'h').disable()
    helpFolder.add({ drag: 'Click + drag = pan' }, 'drag').disable()
    helpFolder.add({ scroll: 'Scroll = zoom in/out' }, 'scroll').disable()

    // Post-processing pipeline
    this.renderPipeline = new RenderPipeline(this.renderer)
    this.renderPipeline.outputColorTransform = false

    const scenePass = pass(this.scene, this.camera)
    const sceneTex = scenePass.getTextureNode()
    this.postU = createPostNode(sceneTex)
    this.renderPipeline.outputNode = renderOutput(this.postU.node)

    this.bindEvents()
    this.animate()
  }

  private bindEvents() {
    const el = this.renderer.domElement

    el.addEventListener('pointerdown', (e) => {
      this.dragging = true
      this.prevX = e.clientX
      this.prevY = e.clientY
      this.velocityX = 0
      this.velocityY = 0
    })

    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return
      const dx = e.clientX - this.prevX
      const dy = e.clientY - this.prevY
      this.prevX = e.clientX
      this.prevY = e.clientY

      const sensitivity = (2 * this.distance * Math.tan((Math.PI / 180) * 30)) / window.innerHeight
      this.targetPanX -= dx * sensitivity
      this.targetPanY += dy * sensitivity

      this.velocityX = -dx * sensitivity
      this.velocityY = dy * sensitivity
    })

    window.addEventListener('pointerup', () => {
      this.dragging = false
    })

    el.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.targetDistance -= e.deltaY * 0.02
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance))
      this.bloomIntensity = Math.min(1, Math.abs(e.deltaY) * 0.015)
    }, { passive: false })

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    window.addEventListener('keydown', (e) => {
      if (e.key === 'r') {
        this.targetPanX = 0
        this.targetPanY = 0
        this.targetDistance = this.defaultDistance / 3.5
      }
      if (e.key === 'h') {
        const el = this.gui.domElement
        el.style.display = el.style.display === 'none' ? '' : 'none'
      }
    })
  }

  private buildTiles() {
    const { wallWidth, wallHeight } = store.getState()
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const clone = dx === 0 && dy === 0
          ? this.gallery.group
          : this.gallery.group.clone()
        clone.position.set(dx * wallWidth, dy * wallHeight, 0)
        this.scene.add(clone)
        this.tiles.push(clone)
      }
    }
    this.tiled = true
  }

  private updateTiles() {
    const { wallWidth, wallHeight } = store.getState()
    const cx = Math.floor((this.panX + wallWidth / 2) / wallWidth)
    const cy = Math.floor((this.panY + wallHeight / 2) / wallHeight)

    if (cx !== this.cellX || cy !== this.cellY) {
      this.cellX = cx
      this.cellY = cy
      let i = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          this.tiles[i].position.set(
            (cx + dx) * wallWidth,
            (cy + dy) * wallHeight,
            0,
          )
          i++
        }
      }
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)

    if (this.gallery.ready && !this.tiled) {
      this.buildTiles()
    }

    if (!this.dragging) {
      const mag = Math.abs(this.velocityX) + Math.abs(this.velocityY)
      if (mag > 0.00008) {
        this.targetPanX += this.velocityX
        this.targetPanY += this.velocityY
        this.velocityX *= 0.97
        this.velocityY *= 0.97
      } else {
        this.velocityX = 0
        this.velocityY = 0
      }
    }

    const lerp = 0.1
    this.panX += (this.targetPanX - this.panX) * lerp
    this.panY += (this.targetPanY - this.panY) * lerp
    this.distance += (this.targetDistance - this.distance) * lerp

    if (this.tiled) {
      this.updateTiles()
    }

    this.camera.position.set(this.panX, this.panY, this.distance)
    this.camera.lookAt(this.panX, this.panY, 0)

    // Orbs follow camera view center
    this.orb.mesh.position.set(this.panX - 4, this.panY, 1.5)
    this.orb2.mesh.position.set(this.panX + 4, this.panY, 1.5)
    this.orb.setColor(this.guiParams.orbColor)
    this.orb2.setColor(this.guiParams.orbColor)

    if (this.zoomHud) {
      const pct = Math.round((this.defaultDistance / this.distance) * 100)
      this.zoomHud.textContent = `zoom ${pct}%`
    }

    const mag = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2)
    const velClamped = Math.max(0, 1 - Math.exp(-mag * 5))
    this.postU.uIntensity.value = velClamped * this.guiParams.intensity
    if (mag > 0.001) {
      this.postU.uVelocityDir.value.set(this.velocityX / mag, this.velocityY / mag)
    }
    this.bloomIntensity *= 0.94
    this.postU.uBloom.value = this.bloomIntensity * this.guiParams.bloom
    this.postU.uPixelSize.value = this.guiParams.pixelSize
    this.postU.uCaOffset.value = this.guiParams.caOffset

    // image inertia rotation
    const maxRot = 0.25
    const rotFactor = this.guiParams.rotSpeed
    this.targetMeshRotY = Math.max(-maxRot, Math.min(maxRot, -this.velocityX * rotFactor))
    this.targetMeshRotX = Math.max(-maxRot, Math.min(maxRot, this.velocityY * rotFactor))
    this.meshRotX += (this.targetMeshRotX - this.meshRotX) * 0.15
    this.meshRotY += (this.targetMeshRotY - this.meshRotY) * 0.15

    if (this.tiled) {
      for (const tile of this.tiles) {
        for (const child of tile.children) {
          child.rotation.x = this.meshRotX
          child.rotation.y = this.meshRotY
        }
      }
    }

    this.renderPipeline.render()
  }

  dispose() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId)
    this.gui.destroy()
    this.renderPipeline.dispose()
    this.renderer.dispose()
  }
}
