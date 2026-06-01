import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Materials from './pages/Materials'
import Dictation from './pages/Dictation'
import Understanding from './pages/Understanding'
import Recitation from './pages/Recitation'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/dictation/:id" element={<Dictation />} />
          <Route path="/understanding/:id" element={<Understanding />} />
          <Route path="/recitation/:id" element={<Recitation />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
