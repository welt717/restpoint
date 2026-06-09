import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    Package,
    DollarSign,
    FileText,
    Image,
    Check,
    X,
} from 'lucide-react';

const UploadProduct = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        description: '',
        stock: '',
        status: 'active',
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        'Caskets',
        'Flowers',
        'Services',
        'Urns',
        'Embalming',
        'Transportation',
        'Memorial',
        'Other',
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        console.log('Product data:', formData);
        console.log('Image:', imagePreview);

        setIsSubmitting(false);
        navigate(`/rptenant/${slug}/marketplace`);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(`/rptenant/${slug}/marketplace`)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '1rem',
                        padding: '0.5rem 0',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.color = '#1a1a1a';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.color = '#6B7280';
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Marketplace
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                    Upload New Product
                </h1>
                <p style={{ color: '#6B7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                    Add a new product to your marketplace inventory
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    padding: '2rem',
                    marginBottom: '2rem',
                }}>
                    {/* Product Image Upload */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.75rem',
                        }}>
                            Product Image
                        </label>
                        <div style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '12px',
                            padding: '2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: '#f9fafb',
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.background = '#f0f4ff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.background = '#f9fafb';
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                                {imagePreview ? (
                                    <div style={{ maxWidth: '200px', margin: '0 auto' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                                            Click to change image
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <Image size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                                        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                                            Drag and drop an image, or click to browse
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                            PNG, JPG up to 5MB
                                        </p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Product Name */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            <Package size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Product Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter product name"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#667eea';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                            }}
                        />
                    </div>

                    {/* Category */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                outline: 'none',
                                background: 'white',
                                transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#667eea';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                            }}
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price and Stock */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.5rem',
                            }}>
                                <DollarSign size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                Price (KES)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                required
                                min="0"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#667eea';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.5rem',
                            }}>
                                Stock Quantity
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="0"
                                required
                                min="0"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#667eea';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                }}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            Status
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { value: 'active', label: 'Active', color: '#22c55e' },
                                { value: 'draft', label: 'Draft', color: '#6b7280' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, status: option.value }))}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1rem',
                                        border: `2px solid ${formData.status === option.value ? option.color : '#d1d5db'}`,
                                        borderRadius: '10px',
                                        background: formData.status === option.value ? `${option.color}15` : 'white',
                                        color: formData.status === option.value ? option.color : '#6b7280',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {formData.status === option.value && <Check size={16} />}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '0' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                        }}>
                            <FileText size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter product description"
                            rows={4}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#667eea';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                            }}
                        />
                    </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={() => navigate(`/rptenant/${slug}/marketplace`)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#f3f4f6';
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '0.75rem 2rem',
                            background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
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
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Upload Product
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

export default UploadProduct;