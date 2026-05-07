import * as THREE from 'three'
import { store } from './store'

export class Gallery {
  group = new THREE.Group()
  ready = false

  load() {
    const modules = import.meta.glob<{ default: string }>(
      './assets/gallery/*.jpg',
      { eager: true },
    )
    const urls = Object.values(modules).map((m) => m.default)

    store.setState({ totalCount: urls.length })

    const loader = new THREE.TextureLoader()

    const wallW = 40
    const wallH = 28
    const cols = 14
    const rows = 10
    const cellW = wallW / cols
    const cellH = wallH / rows

    const cells: [number, number][] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push([c, r])
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cells[i], cells[j]] = [cells[j], cells[i]]
    }

    const count = Math.min(urls.length, cells.length)
    let loaded = 0

    for (let i = 0; i < count; i++) {
      const url = urls[i]
      const [col, row] = cells[i]

      loader.load(url, (texture) => {
        const scale = 0.55 + Math.random() * 0.5
        const jitterX = (Math.random() - 0.5) * cellW * 0.3
        const jitterY = (Math.random() - 0.5) * cellH * 0.3

        const x = (col - cols / 2 + 0.5) * cellW + jitterX
        const y = -(row - rows / 2 + 0.5) * cellH + jitterY

        const img = texture.source.data as HTMLImageElement
        const aspect = img.width / img.height
        const w = cellW * scale * 0.85
        const h = w / aspect

        const geo = new THREE.PlaneGeometry(w, h)
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(x, y, (Math.random() - 0.5) * 0.4)

        this.group.add(mesh)

        loaded++
        store.setState({ loadedCount: loaded })
        if (loaded >= count) {
          this.ready = true
          store.setState({ ready: true })
        }
      })
    }

    store.setState({ wallWidth: wallW, wallHeight: wallH })
  }
}
