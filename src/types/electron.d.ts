export {}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  percent?: number
  transferred?: number
  total?: number
  bytesPerSecond?: number
  message?: string
}

declare global {
  interface Window {
    electron?: {
      platform: string
      isElectron: true
      getVersion: () => Promise<string>
      checkForUpdates: () => Promise<{ ok: boolean; reason?: string }>
      quitAndInstall: () => Promise<void>
      onUpdateStatus: (callback: (data: UpdateStatus) => void) => () => void
    }
  }
}
