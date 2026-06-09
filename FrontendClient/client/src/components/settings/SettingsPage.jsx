import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenantStore } from '../../store/useTenantStore';
import {
  Save,
  Upload,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Image,
  Palette,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Color scheme
const Colors = {
  primary: '#3b82f6',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#1e293b',
  light: '#f8fafc',
  border: '#e2e8f0',
  text: '#1e293b',
  textMuted: '#64748b',
};

const SettingsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { tenantData, setTenantData } = useTenantStore();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#1e293b',
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate that we have a slug to work with
  useEffect(() => {
    if (!slug) {
      navigate('/login', { replace: true });
    }
  }, [slug, navigate]);

  useEffect(() => {
    if (tenantData) {
      setFormData({
        name: tenantData.name || '',
        location: tenantData.location || '',
        phone: tenantData.phone || '',
        email: tenantData.email || '',
        website: tenantData.website || '',
        primaryColor: tenantData.primaryColor || '#1e293b',
        logo: tenantData.logo || null,
      });
      if (tenantData.logo) {
        setLogoPreview(tenantData.logo);
      }
    }
  }, [tenantData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'Logo size must be less than 5MB'
        }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          logo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Organization name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call to update tenant settings
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update the tenant store
      setTenantData({
        ...tenantData,
        ...formData,
      });

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrors({
        submit: 'Failed to save settings. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  const inputStyle = `
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid ${Colors.border};
    border-radius: 8px;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s ease;
  `;

  const labelStyle = `
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${Colors.text};
    margin-bottom: 0.5rem;
  `;

  const errorStyle = `
    font-size: 0.75rem;
    color: ${Colors.danger};
    margin-top: 0.25rem;
  `;

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto',
      padding: '2rem 0',
      background: 'transparent',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: Colors.text, margin: 0 }}>
          Organization Settings
        </h1>
        <p style={{ color: Colors.textMuted, marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Manage your organization's profile and branding
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: `1px solid ${Colors.success}`,
          borderRadius: '10px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: Colors.success,
        }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: '500' }}>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Organization Information */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: `1px solid ${Colors.border}`,
          padding: '2rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: Colors.text, marginBottom: '1.5rem' }}>
            <Building2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Organization Information
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Organization Name */}
            <div>
              <label style={labelStyle}>
                Organization Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Rest Point Funeral Home"
                style={inputStyle}
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>
                <MapPin size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Nairobi, Kenya"
                style={inputStyle}
              />
              {errors.location && <p style={errorStyle}>{errors.location}</p>}
            </div>

            {/* Contact Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>
                  <Phone size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254 700 000 000"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  <Mail size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@organization.com"
                  style={inputStyle}
                />
                {errors.email && <p style={errorStyle}>{errors.email}</p>}
              </div>
            </div>

            {/* Website */}
            <div>
              <label style={labelStyle}>
                <Globe size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.example.com"
                style={inputStyle}
              />
              {errors.website && <p style={errorStyle}>{errors.website}</p>}
            </div>
          </div>
        </div>

        {/* Branding */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: `1px solid ${Colors.border}`,
          padding: '2rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: Colors.text, marginBottom: '1.5rem' }}>
            <Palette size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Branding
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Logo Upload */}
            <div>
              <label style={labelStyle}>
                <Image size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Organization Logo
              </label>
              <div style={{
                border: `2px dashed ${Colors.border}`,
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                background: logoPreview ? 'transparent' : Colors.light,
              }}>
                {logoPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{
                        maxWidth: '150px',
                        maxHeight: '100px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Upload size={24} color={Colors.primary} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', color: Colors.text, margin: 0, fontSize: '0.875rem' }}>
                        Click to upload logo
                      </p>
                      <p style={{ fontSize: '0.75rem', color: Colors.textMuted, margin: '0.25rem 0 0' }}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              {errors.logo && <p style={errorStyle}>{errors.logo}</p>}
            </div>

            {/* Primary Color */}
            <div>
              <label style={labelStyle}>
                Primary Brand Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: `1px solid ${Colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                />
                <div>
                  <p style={{ fontWeight: '600', color: Colors.text, margin: 0, fontSize: '0.875rem' }}>
                    {formData.primaryColor}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: Colors.textMuted, margin: '0.25rem 0 0' }}>
                    This color will be used for your sidebar and branding
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(`/rptenant/${slug}/dashboard`)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: `1px solid ${Colors.border}`,
              borderRadius: '8px',
              color: Colors.textMuted,
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = Colors.textMuted;
              e.target.style.color = Colors.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = Colors.border;
              e.target.style.color = Colors.textMuted;
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 2rem',
              background: isSubmitting ? Colors.textMuted : `linear-gradient(135deg, ${Colors.primary} 0%, #2563eb 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = isSubmitting ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;