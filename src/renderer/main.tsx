import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installAudioRecorderBridge } from './audio/recorder'
import Overlay from './pages/Overlay'
import './index.css'

const params = new URLSearchParams(window.location.search)
const isOverlay = params.get('overlay') === '1' || window.location.hash.startsWith('#/overlay')
const isRecorder = params.get('mode') === 'recorder'

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
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
