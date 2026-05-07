import { Scene } from './scene'

const app = document.getElementById('app')
if (!app) throw new Error('No #app element found')

Scene.create(app)
