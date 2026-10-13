import { useGameController } from './hooks/useGameController'
import { useTheme } from './hooks/useTheme'
import { GameScreen } from './components/GameScreen'
import { PwaPrompts } from './components/PwaPrompts'
import { SetupScreen } from './components/SetupScreen'

export default function App() {
  const ctl = useGameController()
  const dark = useTheme(ctl.settings.theme)
  return (
    <>
      {ctl.game ? <GameScreen ctl={ctl} dark={dark} /> : <SetupScreen ctl={ctl} dark={dark} />}
      <PwaPrompts />
    </>
  )
}
