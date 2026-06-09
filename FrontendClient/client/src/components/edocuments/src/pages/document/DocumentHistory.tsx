import { useState } from 'react'
import './DocumentHistory.css'

export interface DocumentVersion {
  id: string | number
  versionNumber: number
  createdAt: Date
  createdBy: string
  changeDescription: string
  status: 'draft' | 'signed' | 'archived' | 'revoked'
  signature?: string
  tags?: string[]
}

interface DocumentHistoryProps {
  documentId: string | number
  versions: DocumentVersion[]
  onVersionRestore?: (versionId: string | number) => void
  onVersionDownload?: (versionId: string | number) => void
}

export function DocumentHistory({
  documentId,
  versions = [],
  onVersionRestore,
  onVersionDownload,
}: DocumentHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | number | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'signed' | 'archived'>('all')

  const filteredVersions = filter === 'all'
    ? versions
    : versions.filter(v => v.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return '#10b981'
      case 'draft':
        return '#f59e0b'
      case 'archived':
        return '#6b7280'
      case 'revoked':
        return '#ef4444'
      default:
        return '#64748b'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="document-history">
      <div className="history-header">
        <h2>Document History</h2>
        <p className="history-info">
          Document ID: <code>{documentId}</code>
        </p>
      </div>

      <div className="history-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Versions ({versions.length})
        </button>
        <button
          className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({versions.filter(v => v.status === 'draft').length})
        </button>
        <button
          className={`filter-btn ${filter === 'signed' ? 'active' : ''}`}
          onClick={() => setFilter('signed')}
        >
          Signed ({versions.filter(v => v.status === 'signed').length})
        </button>
        <button
          className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
          onClick={() => setFilter('archived')}
        >
          Archived ({versions.filter(v => v.status === 'archived').length})
        </button>
      </div>

      <div className="history-timeline">
        {filteredVersions.length === 0 ? (
          <div className="empty-state">
            <p>No versions found for this filter</p>
          </div>
        ) : (
          filteredVersions.map((version) => (
            <div
              key={version.id}
              className={`history-item ${expandedVersion === version.id ? 'expanded' : ''}`}
            >
              <div
                className="history-item-header"
                onClick={() =>
                  setExpandedVersion(
                    expandedVersion === version.id ? null : version.id
                  )
                }
              >
                <div className="version-info">
                  <span className="version-number">v{version.versionNumber}</span>
                  <span
                    className="version-status"
                    style={{ borderColor: getStatusColor(version.status) }}
                  >
                    {version.status}
                  </span>
                  <span className="version-date">
                    {formatDate(version.createdAt)}
                  </span>
                </div>
                <div className="version-meta">
                  <span className="version-author">by {version.createdBy}</span>
                  <span className="expand-icon">
                    {expandedVersion === version.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedVersion === version.id && (
                <div className="history-item-details">
                  <div className="detail-section">
                    <h4>Change Description</h4>
                    <p>{version.changeDescription || 'No description provided'}</p>
                  </div>

                  {version.tags && version.tags.length > 0 && (
                    <div className="detail-section">
                      <h4>Tags</h4>
                      <div className="tags-list">
                        {version.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {version.signature && (
                    <div className="detail-section">
                      <h4>Signature</h4>
                      <img
                        src={version.signature}
                        alt="Signature"
                        className="signature-preview"
                      />
                    </div>
                  )}

                  <div className="detail-actions">
                    {version.status === 'draft' && onVersionRestore && (
                      <button
                        className="action-btn restore"
                        onClick={() => onVersionRestore(version.id)}
                      >
                        Restore to Draft
                      </button>
                    )}
                    {onVersionDownload && (
                      <button
                        className="action-btn download"
                        onClick={() => onVersionDownload(version.id)}
                      >
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="history-summary">
        <div className="summary-stat">
          <span className="stat-label">Total Versions:</span>
          <span className="stat-value">{versions.length}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Last Modified:</span>
          <span className="stat-value">
            {versions.length > 0
              ? formatDate(versions[0].createdAt)
              : 'Never'}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Status:</span>
          <span className="stat-value">
            {versions.length > 0 ? versions[0].status : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default DocumentHistory
