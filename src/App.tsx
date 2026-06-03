import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Record from '@/pages/Record'
import Search from '@/pages/Search'
import MonthlySummary from '@/pages/MonthlySummary'
import DreamInsights from '@/pages/DreamInsights'
import DreamDetail from '@/pages/DreamDetail'
import EditDream from '@/pages/EditDream'
import TagManager from '@/pages/TagManager'
import DataTransfer from '@/pages/DataTransfer'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/record" element={<Record />} />
          <Route path="/search" element={<Search />} />
          <Route path="/monthly" element={<MonthlySummary />} />
          <Route path="/insights" element={<DreamInsights />} />
          <Route path="/tags" element={<TagManager />} />
          <Route path="/data" element={<DataTransfer />} />
          <Route path="/dream/:id" element={<DreamDetail />} />
          <Route path="/dream/:id/edit" element={<EditDream />} />
        </Route>
      </Routes>
    </Router>
  )
}
