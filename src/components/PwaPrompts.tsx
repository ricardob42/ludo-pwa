import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Non-intrusive toasts: "New version available" and "Ready to work offline". */
export function PwaPrompts() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()
  const [hideOffline, setHideOffline] = useState(false)

  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 5000)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !(offlineReady && !hideOffline)) return null
  return (
    <div role="status" className="fixed inset-x-2 bottom-2 z-[60] mx-auto flex max-w-md flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-900 p-3 text-white shadow-xl">
      {needRefresh ? (
        <>
          <span>New version available, reload?</span>
          <span className="flex gap-2">
            <button className="btn !bg-white !text-gray-900" onClick={() => void updateServiceWorker(true)}>
              Reload
            </button>
            <button className="btn !bg-gray-700" onClick={() => setNeedRefresh(false)}>
              Later
            </button>
          </span>
        </>
      ) : (
        <>
          <span>Ready to play offline.</span>
          <button className="btn !bg-gray-700" onClick={() => setHideOffline(true)}>
            OK
          </button>
        </>
      )}
    </div>
  )
}
