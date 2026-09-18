import { HashRouter, Route, Routes } from 'react-router'
import { HomePage } from './HomePage'
import { PresenterPage } from '@/features/presenter/PresenterPage'
import { ReviewPage } from '@/features/review/ReviewPage'

/** Hash routing keeps deep links working on GitHub Pages and from a local folder. */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/present/:sessionId" element={<PresenterPage />} />
        <Route path="/review/:sessionId" element={<ReviewPage />} />
      </Routes>
    </HashRouter>
  )
}
