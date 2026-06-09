import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, Search, Filter, ArrowUpDown, Store, Plus, 
  Edit2, Trash2, Eye, Package, ShoppingCart, Star, X
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Configuration
const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:8004';
const BASE_API = `${API_GATEWAY}/api/v1`;

// Color scheme
const Colors = {
  primary: '#3b82f6',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  dark: '#1e293b',
  light: '#f8fafc',
  border: '#e2e8f0',
  text: '#1e293b',
  textMuted: '#64748b',
};

// Cart Hook
const useCart = () => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    toast.success('Added to cart!');
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    toast.info('Removed from cart');
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount };
};

// Sample products for fallback
const sampleProducts = [
  {
    id: 1, name: 'Premium Oak Casket', title: 'Premium Oak Casket', category: 'Caskets',
    price: 85000, mrp: 100000, description: 'Handcrafted premium oak casket with velvet interior.',
    stock: 5, status: 'active', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    rating: 4.8, seller: 'Premium Caskets Co.'
  },
  {
    id: 2, name: 'Rose Arrangement', title: 'Elegant Rose Arrangement', category: 'Flowers',
    price: 5500, mrp: 6500, description: 'Beautiful red rose arrangement with greenery.',
    stock: 20, status: 'active', image: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400',
    rating: 4.5, seller: 'Floral Designs'
  },
  {
    id: 3, name: 'Memorial Service Package', title: 'Complete Memorial Service', category: 'Services',
    price: 35000, mrp: 45000, description: 'Complete memorial service planning and coordination.',
    stock: 999, status: 'active', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
    rating: 4.9, seller: 'Memorial Services Ltd'
  },
  {
    id: 4, name: 'Mahogany Casket', title: 'Elegant Mahogany Casket', category: 'Caskets',
    price: 120000, mrp: 150000, description: 'Elegant mahogany wood casket with brass handles.',
    stock: 3, status: 'active', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
    rating: 4.7, seller: 'Premium Caskets Co.'
  },
  {
    id: 5, name: 'Transportation Service', title: 'Professional Transportation', category: 'Services',
    price: 25000, mrp: 30000, description: 'Professional hearse and family vehicle service.',
    stock: 999, status: 'active', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400',
    rating: 4.6, seller: 'Transport Solutions'
  },
  {
    id: 6, name: 'Memorial Urn - Bronze', title: 'Premium Bronze Memorial Urn', category: 'Urns',
    price: 15000, mrp: 18000, description: 'Handcrafted bronze memorial urn.',
    stock: 15, status: 'active', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    rating: 4.8, seller: 'Memorial Crafts'
  },
  {
    id: 7, name: 'Embalming Service', title: 'Professional Embalming', category: 'Services',
    price: 18000, mrp: 22000, description: 'Professional embalming service.',
    stock: 999, status: 'active', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
    rating: 4.9, seller: 'Professional Services'
  },
  {
    id: 8, name: 'Guest Book - Leather', title: 'Premium Leather Guest Book', category: 'Memorabilia',
    price: 3500, mrp: 4500, description: 'Elegant leather-bound guest book.',
    stock: 30, status: 'active', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    rating: 4.4, seller: 'Memorial Crafts'
  }
];

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { cart, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();
  
  const [products, setProducts] = useState(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: sampleProducts.length,
    activeProducts: sampleProducts.filter(p => p.status === 'active').length,
    categories: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_API}/products`, {
        timeout: 15000,
        params: { limit: 50, status: 'active' }
      });
      
      if (response.data && response.data.success) {
        const apiProducts = response.data.data || [];
        if (apiProducts.length > 0) {
          setProducts(apiProducts);
          setStats({
            totalProducts: response.data.pagination?.total || apiProducts.length,
            activeProducts: apiProducts.filter(p => p.status === 'active').length,
            categories: 0,
            outOfStock: apiProducts.filter(p => p.stock === 0).length
          });
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.info('Using sample product data');
      setIsLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    setFilteredProducts(filtered);
  };

  const formatPrice = (price) => `KES ${price?.toLocaleString()}`;

  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    addToCart(product);
  };

  const allCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star key={i} size={14} fill={i < Math.floor(rating || 0) ? '#fbbf24' : 'none'} color="#fbbf24" />
      );
    }
    return stars;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: Colors.text, margin: 0 }}>
            Marketplace
          </h1>
          <p style={{ color: Colors.textMuted, marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Browse and purchase funeral products and services
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowCart(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: Colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <ShoppingCart size={18} />
            Cart
            {getCartCount() > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: Colors.danger,
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>
                {getCartCount()}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(`/rptenant/${slug}/marketplace/upload`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: `linear-gradient(135deg, ${Colors.primary} 0%, #2563eb 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Plus size={18} />
            Upload Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          background: 'white', padding: '1.25rem', borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${Colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color={Colors.primary} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: Colors.textMuted, margin: 0 }}>Total Products</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: Colors.text, margin: 0 }}>{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        <div style={{
          background: 'white', padding: '1.25rem', borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${Colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} color={Colors.success} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: Colors.textMuted, margin: 0 }}>Active</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: Colors.text, margin: 0 }}>{stats.activeProducts}</p>
            </div>
          </div>
        </div>
        <div style={{
          background: 'white', padding: '1.25rem', borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${Colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color={Colors.warning} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: Colors.textMuted, margin: 0 }}>Cart Value</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: Colors.text, margin: 0 }}>{formatPrice(getCartTotal())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white', padding: '1.25rem', borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${Colors.border}`,
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: Colors.textMuted }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem',
                border: `1px solid ${Colors.border}`, borderRadius: '8px',
                fontSize: '0.875rem', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color={Colors.textMuted} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.625rem 2rem 0.625rem 0.75rem', border: `1px solid ${Colors.border}`,
                borderRadius: '8px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', background: 'white',
              }}
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} color={Colors.textMuted} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.625rem 2rem 0.625rem 0.75rem', border: `1px solid ${Colors.border}`,
                borderRadius: '8px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', background: 'white',
              }}
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: Colors.textMuted }}>
          <Package size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: Colors.textMuted }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>No products found</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              style={{
                background: 'white', borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${Colors.border}`,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
              }}
            >
              <div style={{ height: '180px', overflow: 'hidden', background: Colors.light }}>
                <img
                  src={product.image || `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`;
                  }}
                />
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)',
                    color: Colors.purple, borderRadius: '4px', fontSize: '0.7rem', fontWeight: '500',
                  }}>
                    {product.category}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <span style={{
                      padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)',
                      color: Colors.danger, borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600',
                    }}>
                      {Math.round((1 - product.price / product.mrp) * 100)}% OFF
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: Colors.text }}>
                  {product.name}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: Colors.textMuted, lineHeight: '1.4' }}>
                  {product.description?.substring(0, 80)}...
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {renderStars(product.rating)}
                  <span style={{ fontSize: '0.7rem', color: Colors.textMuted }}>
                    ({product.rating || 'N/A'})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: Colors.text }}>
                      {formatPrice(product.price)}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                      <span style={{ fontSize: '0.8rem', color: Colors.textMuted, textDecoration: 'line-through', marginLeft: '0.5rem' }}>
                        {formatPrice(product.mrp)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    disabled={product.stock === 0}
                    style={{
                      padding: '0.5rem 0.75rem', background: product.stock === 0 ? '#ccc' : Colors.primary,
                      color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem',
                      fontWeight: '600', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}
                  >
                    <ShoppingCart size={14} />
                    {product.stock === 0 ? 'Out of Stock' : 'Add'}
                  </button>
                </div>
                {product.stock > 0 && product.stock < 10 && product.stock !== 999 && (
                  <p style={{ fontSize: '0.7rem', color: Colors.warning, margin: '0.5rem 0 0 0' }}>
                    Only {product.stock} left in stock
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        }} onClick={() => setShowCart(false)}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 'min(400px, 90%)', background: 'white',
            display: 'flex', flexDirection: 'column',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1rem', borderBottom: `1px solid ${Colors.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
              }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: Colors.textMuted }}>Your cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', gap: '1rem', padding: '1rem 0',
                    borderBottom: `1px solid ${Colors.border}`,
                  }}>
                    <img
                      src={item.image || `https://via.placeholder.com/80?text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{item.name}</h4>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: Colors.textMuted }}>
                        {formatPrice(item.price)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{
                          padding: '0.25rem 0.5rem', background: Colors.light, border: `1px solid ${Colors.border}`,
                          borderRadius: '4px', cursor: 'pointer',
                        }}>-</button>
                        <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{
                          padding: '0.25rem 0.5rem', background: Colors.light, border: `1px solid ${Colors.border}`,
                          borderRadius: '4px', cursor: 'pointer',
                        }}>+</button>
                        <button onClick={() => removeFromCart(item.id)} style={{
                          marginLeft: 'auto', padding: '0.25rem', background: 'none',
                          border: 'none', color: Colors.danger, cursor: 'pointer',
                        }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '1rem', borderTop: `1px solid ${Colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: '600' }}>Total:</span>
                <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>{formatPrice(getCartTotal())}</span>
              </div>
              <button
                onClick={() => {
                  toast.success('Checkout feature coming soon!');
                }}
                disabled={cart.length === 0}
                style={{
                  width: '100%', padding: '1rem', background: cart.length === 0 ? '#ccc' : Colors.success,
                  color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem',
                  fontWeight: '600', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setSelectedProduct(null)}>
          <div style={{
            background: 'white', borderRadius: '12px', maxWidth: '600px',
            width: '100%', maxHeight: '90vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: `1px solid ${Colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
              }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1rem' }}>
              <img
                src={selectedProduct.image || `https://via.placeholder.com/600x400?text=${encodeURIComponent(selectedProduct.name)}`}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem', background: 'rgba(139, 92, 246, 0.1)',
                  color: Colors.purple, borderRadius: '4px', fontSize: '0.8rem',
                }}>
                  {selectedProduct.category}
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)',
                  color: Colors.success, borderRadius: '4px', fontSize: '0.8rem',
                }}>
                  {selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <p style={{ color: Colors.textMuted, lineHeight: '1.6', marginBottom: '1rem' }}>
                {selectedProduct.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {renderStars(selectedProduct.rating)}
                <span style={{ color: Colors.textMuted, fontSize: '0.9rem' }}>
                  {selectedProduct.rating || 'N/A'} ({selectedProduct.seller || 'Unknown Seller'})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: Colors.text }}>
                  {formatPrice(selectedProduct.price)}
                </span>
                {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                  <span style={{ fontSize: '1rem', color: Colors.textMuted, textDecoration: 'line-through' }}>
                    {formatPrice(selectedProduct.mrp)}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                disabled={selectedProduct.stock === 0}
                style={{
                  width: '100%', padding: '1rem', background: selectedProduct.stock === 0 ? '#ccc' : Colors.primary,
                  color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem',
                  fontWeight: '600', cursor: selectedProduct.stock === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <ShoppingCart size={20} />
                {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;