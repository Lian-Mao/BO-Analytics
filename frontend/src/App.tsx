import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DashboardProvider } from './context/DashboardContext'
import { Dashboard } from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <DashboardProvider>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </DashboardProvider>
    </BrowserRouter>
  )
}
