import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, RefreshCw } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        padding: '3rem',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 2rem',
          background: 'linear-gradient(135deg, #FF4532 0%, #C0392B 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(255, 69, 50, 0.3)'
        }}>
          <AlertTriangle size={48} color="white" />
        </div>

        <h1 style={{
          fontSize: '6rem',
          fontWeight: '800',
          color: '#1a1a1a',
          margin: '0 0 0.5rem',
          lineHeight: 1
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#4a5568',
          margin: '0 0 1rem'
        }}>
          Page Not Found
        </h2>

        <p style={{
          fontSize: '1rem',
          color: '#718096',
          marginBottom: '2rem',
          lineHeight: 1.6
        }}>
          Oops! The page you're looking for doesn't exist or has been moved.
          {location.pathname && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#a0aec0' }}>
              Requested: <code style={{ background: '#f7fafc', padding: '2px 8px', borderRadius: '4px' }}>{location.pathname}</code>
            </div>
          )}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              color: '#4a5568',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.background = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = 'white';
            }}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(13, 110, 253, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 110, 253, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(13, 110, 253, 0.3)';
            }}
          >
            <Home size={18} />
            Home
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
            }}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#a0aec0', margin: 0 }}>
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;