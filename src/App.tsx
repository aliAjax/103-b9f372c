import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Record from '@/pages/Record'
import Search from '@/pages/Search'
import MonthlySummary from '@/pages/MonthlySummary'
import DreamDetail from '@/pages/DreamDetail'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/record" element={<Record />} />
          <Route path="/search" element={<Search />} />
          <Route path="/monthly" element={<MonthlySummary />} />
          <Route path="/dream/:id" element={<DreamDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}
