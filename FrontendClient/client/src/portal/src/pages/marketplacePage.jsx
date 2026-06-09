import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Heart, 
  ShoppingCart, 
  Search, 
  X, 
  Phone, 
  MessageCircle, 
  Share2, 
  Filter,
  Star,
  Truck,
  Shield,
  Info
} from 'lucide-react';

const Colors = {
  primaryDark: '#0a0e27',
  accentGreen: '#22c55e',
  darkGreen: '#16a34a',
  white: '#FFFFFF',
  lightGray: '#f3f4f6',
  mediumGray: '#e5e7eb',
  darkGray: '#6b7280',
  successGreen: '#22c55e',
  dangerRed: '#ef4444',
  warningYellow: '#f59e0b',
  infoBlue: '#3b82f6',
  surface: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
};

const Container = styled.div`
  padding: 0.5rem;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1626 100%);
  min-height: 100vh;
  padding-bottom: 80px;
`;

const Header = styled.div`
  background: rgba(10, 14, 39, 0.8);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 16px;
  margin-bottom: 1rem;
  border: 1px solid rgba(34, 197, 94, 0.2);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.h1`
  color: ${Colors.white};
  font-size: 1.4rem;
  margin: 0;
  font-weight: 700;
`;

const TenantBadge = styled.span`
  padding: 0.25rem 0.75rem;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 20px;
  color: ${Colors.successGreen};
  font-size: 0.75rem;
  font-weight: 500;
`;

const SearchSection = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 14px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.08);
  color: ${Colors.white};
  transition: all 0.2s ease;

  &:focus {
    border-color: ${Colors.successGreen};
    outline: none;
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
`;

const InfoBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  margin-bottom: 1rem;
  color: ${Colors.infoBlue};
  font-size: 0.8rem;
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(34, 197, 94, 0.3);
    border-radius: 2px;
  }
`;

const CategoryTab = styled.button`
  padding: 0.6rem 1rem;
  border: 2px solid ${props => props.active ? Colors.successGreen : 'rgba(34, 197, 94, 0.3)'};
  background: ${props => props.active ? 'rgba(34, 197, 94, 0.2)' : 'transparent'};
  color: ${props => props.active ? Colors.successGreen : Colors.darkGray};
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    border-color: ${Colors.successGreen};
    color: ${Colors.successGreen};
    background: rgba(34, 197, 94, 0.1);
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: ${Colors.surface};
  border: 1px solid ${Colors.border};
  border-radius: 10px;
  color: ${Colors.darkGray};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${Colors.white};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const SortSelect = styled.select`
  padding: 0.5rem 0.875rem;
  background: ${Colors.surface};
  border: 1px solid ${Colors.border};
  border-radius: 10px;
  color: ${Colors.darkGray};
  font-size: 0.8rem;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: ${Colors.successGreen};
  }

  option {
    background: #1a1f3a;
    color: ${Colors.white};
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ProductCard = styled.div`
  background: linear-gradient(135deg, #1a1f3a 0%, #0f1626 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 1px solid rgba(34, 197, 94, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.3);
  }
`;

const ProductBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: ${props => {
    if (props.type === 'popular') return 'rgba(245, 158, 11, 0.2)';
    if (props.type === 'new') return 'rgba(34, 197, 94, 0.2)';
    return 'rgba(59, 130, 246, 0.2)';
  }};
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${props => {
    if (props.type === 'popular') return Colors.warningYellow;
    if (props.type === 'new') return Colors.successGreen;
    return Colors.infoBlue;
  }};
  z-index: 1;
`;

const ProductImage = styled.div`
  width: 100%;
  height: 130px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(22, 163, 74, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  position: relative;
`;

const ProductRating = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  font-size: 0.7rem;
  color: ${Colors.warningYellow};
`;

const ProductContent = styled.div`
  padding: 0.875rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const ProductVendor = styled.div`
  font-size: 0.65rem;
  color: ${Colors.textMuted};
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ProductName = styled.h3`
  color: ${Colors.white};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.375rem;
  line-height: 1.3;
`;

const ProductDescription = styled.p`
  color: ${Colors.darkGray};
  font-size: 0.72rem;
  margin: 0 0 0.5rem;
  flex-grow: 1;
  line-height: 1.4;
`;

const ProductFeatures = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const FeatureTag = styled.span`
  padding: 0.15rem 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 6px;
  font-size: 0.6rem;
  color: ${Colors.successGreen};
`;

const ProductFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${Colors.border};
`;

const ProductPrice = styled.div`
  color: ${Colors.successGreen};
  font-size: 1rem;
  font-weight: 700;
`;

const ProductActions = styled.div`
  display: flex;
  gap: 0.375rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    if (props.type === 'like') return props.liked ? 'rgba(239, 68, 68, 0.15)' : Colors.surface;
    if (props.type === 'share') return 'rgba(59, 130, 246, 0.1)';
    return 'rgba(34, 197, 94, 0.15)';
  }};
  color: ${props => {
    if (props.type === 'like') return props.liked ? Colors.dangerRed : Colors.darkGray;
    if (props.type === 'share') return Colors.infoBlue;
    return Colors.successGreen;
  }};

  &:hover {
    background: ${props => {
      if (props.type === 'like') return props.liked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.2)';
      if (props.type === 'share') return 'rgba(59, 130, 246, 0.2)';
      return 'rgba(34, 197, 94, 0.25)';
    }};
    transform: scale(1.05);
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;

const ShareModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const ShareModalContent = styled.div`
  background: #1a1f3a;
  border-radius: 20px;
  padding: 1.5rem;
  width: 100%;
  max-width: 360px;
  border: 1px solid ${Colors.border};
`;

const ShareTitle = styled.h3`
  color: ${Colors.white};
  font-size: 1rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const ShareOption = styled.button`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${Colors.surface};
  border: 1px solid ${Colors.border};
  border-radius: 12px;
  color: ${Colors.white};
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${props => props.color || Colors.successGreen};
  }

  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.color || Colors.successGreen};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${Colors.darkGray};
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${Colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    width: 28px;
    height: 28px;
    opacity: 0.5;
  }
`;

const CartBar = styled.div`
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: rgba(10, 14, 39, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
  z-index: 100;
`;

const CartInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CartCount = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${Colors.successGreen};
  color: ${Colors.primaryDark};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
`;

const CartTotal = styled.span`
  color: ${Colors.white};
  font-size: 0.9rem;
`;

const CheckoutButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${Colors.successGreen} 0%, ${Colors.darkGreen} 100%);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// Tenant-specific products
const TENANT_PRODUCTS = {
  restpoint: [
    {
      id: 1,
      name: 'Premium Oak Casket',
      category: 'caskets',
      price: 'KES 85,000',
      description: 'Handcrafted premium oak casket with velvet interior',
      emoji: '⚰️',
      vendor: 'Rest Point Funeral',
      rating: 4.9,
      features: ['Velvet Interior', 'Solid Oak'],
      badge: 'popular'
    },
    {
      id: 2,
      name: 'Rose Arrangement',
      category: 'flowers',
      price: 'KES 5,500',
      description: 'Elegant red rose arrangement with greenery',
      emoji: '🌹',
      vendor: 'Garden Fresh',
      rating: 4.8,
      features: ['Fresh Daily', 'Custom Colors'],
      badge: 'new'
    },
    {
      id: 3,
      name: 'Memorial Service Package',
      category: 'services',
      price: 'KES 35,000',
      description: 'Complete memorial service planning and coordination',
      emoji: '🕯️',
      vendor: 'Rest Point Services',
      rating: 5.0,
      features: ['Full Planning', 'Officiant Included'],
      badge: 'popular'
    },
    {
      id: 4,
      name: 'Mahogany Casket',
      category: 'caskets',
      price: 'KES 120,000',
      description: 'Elegant mahogany wood casket with brass handles',
      emoji: '⚰️',
      vendor: 'Premium Caskets Co.',
      rating: 4.9,
      features: ['Brass Handles', 'Engraving Available'],
    },
    {
      id: 5,
      name: 'Mixed Flower Bundle',
      category: 'flowers',
      price: 'KES 7,500',
      description: 'Seasonal mixed flower arrangement',
      emoji: '💐',
      vendor: 'Garden Fresh',
      rating: 4.7,
      features: ['Seasonal', 'Large Arrangement'],
    },
    {
      id: 6,
      name: 'Transportation Service',
      category: 'services',
      price: 'KES 25,000',
      description: 'Professional hearse and family vehicle',
      emoji: '🚗',
      vendor: 'Rest Point Transport',
      rating: 4.9,
      features: ['Luxury Vehicles', 'Professional Driver'],
    },
    {
      id: 7,
      name: 'Standard Metal Casket',
      category: 'caskets',
      price: 'KES 45,000',
      description: 'Quality metal casket at an affordable price',
      emoji: '⚰️',
      vendor: 'Rest Point Funeral',
      rating: 4.6,
      features: ['Durable', 'Various Colors'],
    },
    {
      id: 8,
      name: 'Memorial Keepsake Urn',
      category: 'urns',
      price: 'KES 12,500',
      description: 'Beautiful keepsake urn for memorial keepsakes',
      emoji: '🏺',
      vendor: 'Artisan Urns',
      rating: 4.8,
      features: ['Handcrafted', 'Custom Engraving'],
      badge: 'new'
    },
    {
      id: 9,
      name: 'Cremation Service',
      category: 'services',
      price: 'KES 30,000',
      description: 'Complete cremation service with urn included',
      emoji: '✨',
      vendor: 'Rest Point Services',
      rating: 4.9,
      features: ['Urn Included', 'Certificate'],
    },
  ],
};

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'caskets', label: 'Caskets' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'services', label: 'Services' },
  { id: 'urns', label: 'Urns' },
];

const MarketplacePage = ({ onLogout, userData }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [likedProducts, setLikedProducts] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProduct, setShareProduct] = useState(null);
  const [tenantSlug, setTenantSlug] = useState('restpoint');

  // Get tenant-specific products
  const products = TENANT_PRODUCTS[tenantSlug] || TENANT_PRODUCTS.restpoint;

  useEffect(() => {
    // Get tenant from localStorage
    const storedTenant = localStorage.getItem('tenantSlug');
    if (storedTenant) {
      setTenantSlug(storedTenant);
    }
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price.replace(/[^0-9]/g, '')) - parseFloat(b.price.replace(/[^0-9]/g, ''));
      case 'price-high':
        return parseFloat(b.price.replace(/[^0-9]/g, '')) - parseFloat(a.price.replace(/[^0-9]/g, ''));
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const toggleLike = (productId) => {
    setLikedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const addToCart = (product) => {
    setCartItems(prev => [...prev, product]);
  };

  const handleShare = (product) => {
    setShareProduct(product);
    setShowShareModal(true);
  };

  const shareToWhatsApp = () => {
    const phoneNumber = '+254740045355';
    const message = encodeURIComponent(`Check out: ${shareProduct.name} - ${shareProduct.price}\n${shareProduct.description}`);
    window.open(`https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`, '_blank');
    setShowShareModal(false);
  };

  const shareToSMS = () => {
    const phoneNumber = '+254740045355';
    const message = encodeURIComponent(`Check out: ${shareProduct.name} - ${shareProduct.price}`);
    window.location.href = `sms:${phoneNumber}?body=${message}`;
    setShowShareModal(false);
  };

  const shareViaCall = () => {
    window.location.href = 'tel:+254740045355';
    setShowShareModal(false);
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.price.replace(/[^0-9]/g, ''));
  }, 0);

  return (
    <Container>
      <Header>
        <HeaderTop>
          <HeaderTitle>Marketplace</HeaderTitle>
          <TenantBadge>{tenantSlug}</TenantBadge>
        </HeaderTop>
        
        <InfoBanner>
          <Info size={14} />
          <span>Products from your tenant - visible only to your organization</span>
        </InfoBanner>

        <SearchSection>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search products, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchSection>
      </Header>

      <CategoryTabs>
        {CATEGORIES.map(category => (
          <CategoryTab
            key={category.id}
            active={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
          </CategoryTab>
        ))}
      </CategoryTabs>

      <FilterBar>
        <FilterButton>
          <Filter size={14} />
          Filters
        </FilterButton>
        <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="default">Sort by: Default</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </SortSelect>
      </FilterBar>

      {sortedProducts.length > 0 ? (
        <ProductsGrid>
          {sortedProducts.map(product => (
            <ProductCard key={product.id}>
              {product.badge && <ProductBadge type={product.badge}>{product.badge === 'popular' ? '🔥 Popular' : '✨ New'}</ProductBadge>}
              <ProductImage>
                {product.emoji}
                <ProductRating>
                  <Star size={12} fill="currentColor" />
                  {product.rating}
                </ProductRating>
              </ProductImage>
              <ProductContent>
                <ProductVendor>
                  <Shield size={10} />
                  {product.vendor}
                </ProductVendor>
                <ProductName>{product.name}</ProductName>
                <ProductDescription>{product.description}</ProductDescription>
                {product.features && (
                  <ProductFeatures>
                    {product.features.map((feature, idx) => (
                      <FeatureTag key={idx}>{feature}</FeatureTag>
                    ))}
                  </ProductFeatures>
                )}
                <ProductFooter>
                  <ProductPrice>{product.price}</ProductPrice>
                  <ProductActions>
                    <ActionButton
                      type="like"
                      liked={likedProducts[product.id]}
                      onClick={() => toggleLike(product.id)}
                      title="Add to favorites"
                    >
                      <Heart fill={likedProducts[product.id] ? 'currentColor' : 'none'} size={15} />
                    </ActionButton>
                    <ActionButton
                      type="share"
                      onClick={() => handleShare(product)}
                      title="Share product"
                    >
                      <Share2 size={15} />
                    </ActionButton>
                    <ActionButton
                      onClick={() => addToCart(product)}
                      title="Add to cart"
                    >
                      <ShoppingCart size={15} />
                    </ActionButton>
                  </ProductActions>
                </ProductFooter>
              </ProductContent>
            </ProductCard>
          ))}
        </ProductsGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>
            <Search size={28} />
          </EmptyIcon>
          <p>No products found. Try a different search or category.</p>
        </EmptyState>
      )}

      {cartItems.length > 0 && (
        <CartBar>
          <CartInfo>
            <CartCount>{cartItems.length}</CartCount>
            <CartTotal>KES {cartTotal.toLocaleString()}</CartTotal>
          </CartInfo>
          <CheckoutButton>
            <ShoppingCart size={18} />
            Checkout
          </CheckoutButton>
        </CartBar>
      )}

      {showShareModal && (
        <ShareModal onClick={() => setShowShareModal(false)}>
          <ShareModalContent onClick={(e) => e.stopPropagation()}>
            <ShareTitle>Share "{shareProduct?.name}"</ShareTitle>
            <ShareOption onClick={shareToWhatsApp} color="#25D366">
              <MessageCircle size={18} />
              Share via WhatsApp
            </ShareOption>
            <ShareOption onClick={shareToSMS} color="#3b82f6">
              <MessageCircle size={18} />
              Send SMS
            </ShareOption>
            <ShareOption onClick={shareViaCall} color={Colors.successGreen}>
              <Phone size={18} />
              Call to Order
            </ShareOption>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                background: 'transparent',
                border: `1px solid ${Colors.border}`,
                borderRadius: '12px',
                color: Colors.darkGray,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
          </ShareModalContent>
        </ShareModal>
      )}
    </Container>
  );
};

export default MarketplacePage;