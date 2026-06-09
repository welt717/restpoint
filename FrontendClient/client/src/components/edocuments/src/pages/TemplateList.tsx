import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTemplates } from '../services/pdfService'

interface Template {
  id: number
  name: string
  fields_count: number
  file_url: string
  created_at: string
}

export function TemplateList() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTemplates()
      .then((res) => setTemplates(res.data.data))
      .catch(() => setError('Failed to load templates.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="list-page">
      <div className="list-header">
        <h1>PDF Templates</h1>
        <button className="primary" onClick={() => navigate('/builder')}>
          + New Template
        </button>
      </div>

      {loading && <p className="muted">Loading templates…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && templates.length === 0 && (
        <div className="list-empty">
          <p>No templates yet.</p>
          <button className="primary" onClick={() => navigate('/builder')}>
            Create your first template
          </button>
        </div>
      )}

      {templates.length > 0 && (
        <table className="template-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Fields</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="muted">{t.id}</td>
                <td>{t.name}</td>
                <td className="muted">{t.fields_count}</td>
                <td className="muted">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="row-actions">
                  <button onClick={() => navigate(`/sign/${t.id}`)}>
                    eSign
                  </button>
                  <a href={t.file_url} target="_blank" rel="noreferrer">
                    <button>View PDF</button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
