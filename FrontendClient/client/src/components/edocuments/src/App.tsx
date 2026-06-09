import { Routes, Route } from 'react-router-dom'
import { TemplateList } from './pages/TemplateList'
import { ESignPage } from './pages/ESignPage'
import { BuilderPage } from './pages/BuilderPage'
import { DocumentEditor } from './pages/document/DocumentEditor'
import { DocumentHistory } from './pages/document/DocumentHistory'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TemplateList />} />
      <Route path="/sign/:id" element={<ESignPage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="/document/:id" element={<DocumentEditor />} />
      <Route path="/document/:id/history" element={<DocumentHistory documentId="" versions={[]} />} />
      <Route path="/editor" element={<DocumentEditor />} />
    </Routes>
  )
}

export default App
