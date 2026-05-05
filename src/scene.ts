import * as THREE from 'three'
import { useStore } from './store'

export class Scene {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private cube: THREE.Mesh
  private animationId: number | null = null

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a0a2e)

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    this.camera.position.z = 5

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
    this.cube = new THREE.Mesh(geometry, material)
    this.scene.add(this.cube)

    const ambientLight = new THREE.AmbientLight(0x404060, 1.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(5, 5, 5)
    this.scene.add(directionalLight)

    window.addEventListener('resize', this.onResize)
    this.animate()
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)

    const { rotationSpeed } = useStore.getState()
    this.cube.rotation.x += rotationSpeed * 0.01
    this.cube.rotation.y += rotationSpeed * 0.01

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }
}
