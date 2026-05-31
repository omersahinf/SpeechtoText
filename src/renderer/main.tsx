import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installAudioRecorderBridge } from './audio/recorder'
import Overlay from './pages/Overlay'
import { TrayDropdown } from './components/tray/TrayDropdown'
import './index.css'

const params = new URLSearchParams(window.location.search)
const isOverlay = params.get('overlay') === '1' || window.location.hash.startsWith('#/overlay')
const isRecorder = params.get('mode') === 'recorder'
const isTray = window.location.hash.startsWith('#/tray')

if (isOverlay) {
  document.documentElement.dataset.window = 'overlay'
} else if (isTray) {
  document.documentElement.dataset.window = 'tray'
} else if (isRecorder) {
  document.documentElement.dataset.window = 'recorder'
} else {
  document.documentElement.dataset.window = 'app'
}

if (isRecorder) {
  installAudioRecorderBridge()
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

if (isOverlay) {
  root.render(
    <React.StrictMode>
      <Overlay />
    </React.StrictMode>
  )
} else if (isRecorder) {
  root.render(<main />)
} else if (isTray) {
  root.render(
    <React.StrictMode>
      <TrayDropdown />
    </React.StrictMode>
  )
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
