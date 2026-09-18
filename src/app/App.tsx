import { HashRouter, Route, Routes } from 'react-router'
import { HomePage } from './HomePage'
import { SoundCheckPage } from '@/features/audio/SoundCheckPage'
import { PresenterPage } from '@/features/presenter/PresenterPage'
import { ReviewPage } from '@/features/review/ReviewPage'
import { SlideCheckPage } from '@/features/review/SlideCheckPage'
import { VerifyPage } from '@/features/review/VerifyPage'

/** Hash routing keeps deep links working on GitHub Pages and from a local folder. */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/present/:sessionId" element={<PresenterPage />} />
        <Route path="/review/:sessionId" element={<ReviewPage />} />
        <Route path="/sounds" element={<SoundCheckPage />} />
        <Route path="/slides/:sessionId" element={<SlideCheckPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
    </HashRouter>
  )
}
