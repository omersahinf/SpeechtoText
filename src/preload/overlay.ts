import { contextBridge, ipcRenderer } from 'electron'
import type {
  OverlayApi,
  OverlayMicInfo,
  OverlayMouseRegion,
  OverlayState,
  OverlayStateDetail,
  TransformMode
} from '@/shared/types'

const overlayApi: OverlayApi = {
  onState(callback) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: OverlayState,
      detail?: OverlayStateDetail
    ): void => callback(state, detail)

    ipcRenderer.on('overlay:state', listener)
    return () => ipcRenderer.removeListener('overlay:state', listener)
  },
  onLevel(callback) {
    const listener = (_event: Electron.IpcRendererEvent, level: number): void => callback(level)
    ipcRenderer.on('overlay:level', listener)
    return () => ipcRenderer.removeListener('overlay:level', listener)
  },
  onMicInfo(callback) {
    const listener = (_event: Electron.IpcRendererEvent, info: OverlayMicInfo): void =>
      callback(info)
    ipcRenderer.on('overlay:mic-info', listener)
    return () => ipcRenderer.removeListener('overlay:mic-info', listener)
  },
  onSettings(callback) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      settings: Parameters<Parameters<OverlayApi['onSettings']>[0]>[0]
    ): void => callback(settings)

    ipcRenderer.on('overlay:settings', listener)
    return () => ipcRenderer.removeListener('overlay:settings', listener)
  },
  cancelRecording() {
    return ipcRenderer.invoke('overlay:cancel-recording')
  },
  stopRecording() {
    return ipcRenderer.invoke('overlay:stop-recording')
  },
  openSettings() {
    return ipcRenderer.invoke('overlay:open-settings')
  },
  setAutoApply(enabled: boolean) {
    return ipcRenderer.invoke('overlay:set-auto-apply', enabled)
  },
  setTransformMode(mode: TransformMode) {
    return ipcRenderer.invoke('overlay:set-transform-mode', mode)
  },
  setMouseRegion(region: OverlayMouseRegion) {
    ipcRenderer.send('overlay:set-mouse-region', region)
  },
  quickEdit(instruction: string) {
    const text = navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.resolve('')
    return text.then((clipText) =>
      ipcRenderer.invoke('overlay:quick-edit', { text: clipText, instruction })
    )
  }
}

contextBridge.exposeInMainWorld('overlayApi', overlayApi)
