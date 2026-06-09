import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocumentEditor } from '../components/editor/DocumentEditor'
import type { CanvasState } from '../types'
import './BuilderPage.css'

export function BuilderPage() {
  const navigate = useNavigate()
  const [savedState, setSavedState] = useState<CanvasState | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  const handleSave = useCallback(
    async (state: CanvasState) => {
      setSaveStatus('saving')
      try {
        // TODO: Implement actual API call to save template
        // await api.post('/templates', state)
        
        setSavedState(state)
        setSaveStatus('success')

        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000)
      } catch (error) {
        console.error('Failed to save template:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    []
  )

  const handleClose = () => {
    navigate('/edocuments')
  }

  return (
    <div className="builder-page-wrapper">
      {/* Notification Area */}
      {saveStatus !== 'idle' && (
        <div className={`notification notification-${saveStatus}`}>
          {saveStatus === 'saving' && <span>💾 Saving template...</span>}
          {saveStatus === 'success' && <span>✓ Template saved successfully!</span>}
          {saveStatus === 'error' && <span>✗ Failed to save template. Please try again.</span>}
        </div>
      )}

      {/* Main Editor */}
      <DocumentEditor
        onSave={handleSave}
        onClose={handleClose}
        initialState={savedState || undefined}
      />
    </div>
  )
}
