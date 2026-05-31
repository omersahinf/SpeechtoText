import { useState, useEffect, type ReactElement } from 'react'
import type { PermissionSnapshot } from '@/shared/types'
import { getPermissionLabel } from '@/renderer/lib/permission-labels'

export function PermissionsTab(): ReactElement {
  const [permissions, setPermissions] = useState<PermissionSnapshot | null>(null)
  const [accessibilityJustGranted, setAccessibilityJustGranted] = useState(false)

  const refreshPermissions = async (): Promise<void> => {
    const p = await window.api.permissions.check()
    setPermissions(p)
  }

  useEffect(() => {
    void refreshPermissions()

    const interval = window.setInterval(() => void refreshPermissions(), 3000)
    const unsub = window.api.permissions.onAccessibilityGranted(() => {
      setAccessibilityJustGranted(true)
      void refreshPermissions()
    })

    return () => {
      window.clearInterval(interval)
      unsub()
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Gizlilik ve İzinler</h2>
        <p className="mt-1 text-sm text-neutral-500">Sistem izinleri ve erişilebilirlik ayarları</p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-8">
        {/* Mikrofon */}
        <section aria-label="Mikrofon izni">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-neutral-200">Mikrofon Erişimi</h3>
              <p className="mt-1 text-sm text-neutral-500">Sesini duyabilmemiz için gerekli.</p>
            </div>
            <span
              className={`text-sm font-medium ${getPermissionLabel(permissions?.microphone ?? 'unknown').color}`}
            >
              {getPermissionLabel(permissions?.microphone ?? 'unknown').text}
            </span>
          </div>
          {permissions?.microphone !== 'granted' && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="h-10 rounded-lg bg-sd-accent px-5 text-sm font-medium text-neutral-950 transition hover:opacity-90 active:scale-[0.98]"
                onClick={() => void window.api.permissions.requestMicrophone().then(setPermissions)}
              >
                Mikrofon İzni İste
              </button>
              <button
                type="button"
                className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500"
                onClick={() => void refreshPermissions()}
              >
                Kontrol Et
              </button>
            </div>
          )}
          {permissions?.microphone === 'granted' && (
            <div className="mt-4">
              <button
                type="button"
                className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500"
                onClick={() => void window.api.permissions.openMicrophoneSettings()}
              >
                Sistem Ayarlarını Aç (Kapatmak için)
              </button>
            </div>
          )}
        </section>

        {/* Accessibility */}
        <section aria-label="Erişilebilirlik izni" className="border-t border-neutral-800/40 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-neutral-200">
                Erişilebilirlik (Accessibility)
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Global kısayol kullanımı ve metin yapıştırma için gerekli.
              </p>
            </div>
            <span
              className={`text-sm font-medium ${getPermissionLabel(permissions?.accessibility ?? 'unknown').color}`}
            >
              {getPermissionLabel(permissions?.accessibility ?? 'unknown').text}
            </span>
          </div>

          {permissions?.accessibility !== 'granted' &&
            permissions?.accessibility !== 'unsupported' && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="h-10 rounded-lg bg-sd-accent px-5 text-sm font-medium text-neutral-950 transition hover:opacity-90 active:scale-[0.98]"
                  onClick={() => void window.api.permissions.openAccessibilitySettings()}
                >
                  Sistem Ayarlarını Aç
                </button>
                <button
                  type="button"
                  className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500"
                  onClick={() => void refreshPermissions()}
                >
                  Kontrol Et
                </button>
              </div>
            )}

          {accessibilityJustGranted && permissions?.accessibility === 'granted' && (
            <div className="mt-5 rounded-lg border border-sd-accent bg-sd-hover p-4">
              <p className="text-sm text-sd-accent">
                ✓ İzin onaylandı. Aktif olması için uygulamayı yeniden başlatman gerekiyor.
              </p>
              <button
                type="button"
                className="mt-3 h-9 rounded-lg bg-sd-accent px-4 text-sm font-medium text-neutral-950 transition hover:opacity-90 active:scale-[0.98]"
                onClick={() => void window.api.app.relaunch()}
              >
                Yeniden Başlat
              </button>
            </div>
          )}

          {permissions?.accessibility === 'unsupported' && (
            <p className="mt-4 text-sm text-neutral-500">
              Bu işletim sisteminde erişilebilirlik iznine gerek yok.
            </p>
          )}

          {permissions?.accessibility === 'granted' && !accessibilityJustGranted && (
            <div className="mt-4">
              <button
                type="button"
                className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500"
                onClick={() => void window.api.permissions.openAccessibilitySettings()}
              >
                Sistem Ayarlarını Aç (Kapatmak için)
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
