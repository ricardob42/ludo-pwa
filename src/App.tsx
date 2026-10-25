import { useGameController } from './hooks/useGameController'
import { LangProvider } from './hooks/useLang'
import { useTheme } from './hooks/useTheme'
import { GameScreen } from './components/GameScreen'
import { PwaPrompts } from './components/PwaPrompts'
import { SetupScreen } from './components/SetupScreen'

export default function App() {
  const ctl = useGameController()
  const dark = useTheme(ctl.settings.theme)
  return (
    <LangProvider lang={ctl.settings.lang}>
      {ctl.game ? <GameScreen ctl={ctl} dark={dark} /> : <SetupScreen ctl={ctl} dark={dark} />}
      <PwaPrompts />
    </LangProvider>
  )
}
