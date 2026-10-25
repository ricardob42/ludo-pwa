import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useT } from '../hooks/useLang'

/** Non-intrusive toasts: "New version available" and "Ready to work offline". */
export function PwaPrompts() {
  const t = useT()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()
  const [hideOffline, setHideOffline] = useState(false)

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), 5000)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !(offlineReady && !hideOffline)) return null
  return (
    <div role="status" className="fixed inset-x-2 bottom-2 z-[60] mx-auto flex max-w-md flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-900 p-3 text-white shadow-xl">
      {needRefresh ? (
        <>
          <span>{t('updateAvail')}</span>
          <span className="flex gap-2">
            <button className="btn !bg-white !text-gray-900" onClick={() => void updateServiceWorker(true)}>
              {t('reload')}
            </button>
            <button className="btn !bg-gray-700" onClick={() => setNeedRefresh(false)}>
              {t('later')}
            </button>
          </span>
        </>
      ) : (
        <>
          <span>{t('offlineReady')}</span>
          <button className="btn !bg-gray-700" onClick={() => setHideOffline(true)}>
            {t('ok')}
          </button>
        </>
      )}
    </div>
  )
}
