import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Heart,
  Share2,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Truck,
  Shield,
  Clock,
  ImageOff,
} from "lucide-react";
import axios from "axios";
import ProductDetail from "./ProductDetail";
import AdBanner from "./AdBanner";

const API_URL = "https://prisoners-brook-bands-dare.trycloudflare.com";

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 80px);
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  margin-bottom: 24px;
  padding: 8px 0;
  font-size: 14px;
  transition: color 0.2s;

  &:hover {
    color: #bb0000;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 24px;
  }
`;

const ImageSection = styled.div`
  text-align: center;
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 16px;
`;

const ProductImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 16px;
  padding: 20px;
`;

const NoImagePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  padding: 40px;

  svg {
    width: 64px;
    height: 64px;
    stroke-width: 1;
  }
`;

const InfoSection = styled.div``;

const ProductTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a2e;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ProductSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const RatingBadge = styled.span`
  background: #388e3c;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const ReviewCount = styled.span`
  color: #878787;
  font-size: 14px;
`;

const PriceSection = styled.div`
  margin: 24px 0;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
`;

const CurrentPrice = styled.span`
  font-size: 36px;
  font-weight: 700;
  color: #bb0000;
  margin-right: 12px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const OriginalPrice = styled.span`
  font-size: 20px;
  color: #878787;
  text-decoration: line-through;
  margin-right: 12px;
`;

const Discount = styled.span`
  font-size: 16px;
  color: #388e3c;
  font-weight: 500;
  background: #e8f5e9;
  padding: 4px 8px;
  border-radius: 20px;
`;

const DeliveryInfo = styled.div`
  display: flex;
  gap: 20px;
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  flex-wrap: wrap;
`;

const DeliveryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #666;

  svg {
    color: #bb0000;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin: 24px 0;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const AddToCartButton = styled.button`
  flex: 1;
  background: #ff9f00;
  color: white;
  border: none;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: #fb641b;
    transform: translateY(-1px);
  }
`;

const BuyNowButton = styled.button`
  flex: 1;
  background: #bb0000;
  color: white;
  border: none;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: #990000;
    transform: translateY(-1px);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const ActionButton = styled.button`
  flex: 1;
  background: white;
  border: 1px solid #e0e0e0;
  padding: 10px;
  border-radius: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #666;

  &:hover {
    background: #f5f5f5;
    border-color: #bb0000;
    color: #bb0000;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  gap: 16px;
  flex-direction: column;
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  color: #bb0000;
`;

// Consistent image URL helper (same as Slide component)
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("/")) {
    return `${API_URL}${imagePath}`;
  }
  return `${API_URL}/${imagePath}`;
};

const DetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log("Fetching product with ID:", id);
        const response = await axios.get(`${API_URL}/api/products/${id}`);
        console.log("Product response:", response.data);

        if (response.data.success) {
          setProduct(response.data.data);
          console.log("Product image path:", response.data.data.image);
          setImageError(false);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      const cart = JSON.parse(localStorage.getItem("marketplace_cart") || "[]");
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("marketplace_cart", JSON.stringify(cart));
      alert(`${product.name} added to cart!`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/marketplace/cart");
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner size={48} />
        <div>Loading product details...</div>
      </LoadingContainer>
    );
  }

  if (error || !product) {
    return (
      <LoadingContainer>
        <p style={{ color: "#ff4444" }}>{error || "Product not found"}</p>
        <button onClick={() => navigate("/marketplace")}>Back to Store</button>
      </LoadingContainer>
    );
  }

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const imageUrl = getImageUrl(product.image);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);

  const handleImageError = () => {
    console.error("Failed to load image:", imageUrl);
    console.log("Original image path:", product.image);
    setImageError(true);
  };

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Back to Store
      </BackButton>

      <ProductGrid>
        <ImageSection>
          {!imageError && imageUrl ? (
            <ProductImage
              src={imageUrl}
              alt={product.name}
              onError={handleImageError}
            />
          ) : (
            <NoImagePlaceholder>
              <ImageOff size={64} />
              <p>No image available</p>
              <p style={{ fontSize: "12px", color: "#ccc" }}>
                Image path: {product.image || "none"}
              </p>
              <p style={{ fontSize: "10px", color: "#aaa", marginTop: "8px" }}>
                Expected URL: {imageUrl || "none"}
              </p>
            </NoImagePlaceholder>
          )}
        </ImageSection>

        <InfoSection>
          <ProductTitle>{product.name}</ProductTitle>
          {product.title && <ProductSubtitle>{product.title}</ProductSubtitle>}

          <RatingContainer>
            <RatingBadge>4.5 ★</RatingBadge>
            <ReviewCount>1,234 ratings & 567 reviews</ReviewCount>
          </RatingContainer>

          <PriceSection>
            <CurrentPrice>KES {product.price?.toLocaleString()}</CurrentPrice>
            {product.mrp && product.mrp > product.price && (
              <>
                <OriginalPrice>
                  KES {product.mrp?.toLocaleString()}
                </OriginalPrice>
                <Discount>{discount}% off</Discount>
              </>
            )}
          </PriceSection>

          <DeliveryInfo>
            <DeliveryItem>
              <Truck size={16} />
              <span>Free delivery by {deliveryDate.toLocaleDateString()}</span>
            </DeliveryItem>
            <DeliveryItem>
              <Shield size={16} />
              <span>10 days replacement</span>
            </DeliveryItem>
            <DeliveryItem>
              <Clock size={16} />
              <span>In stock • {product.stock || 50} items left</span>
            </DeliveryItem>
          </DeliveryInfo>

          <ButtonGroup>
            <AddToCartButton onClick={handleAddToCart}>
              <ShoppingCart size={18} />
              Add to Cart
            </AddToCartButton>
            <BuyNowButton onClick={handleBuyNow}>Buy Now</BuyNowButton>
          </ButtonGroup>

          <ActionButtons>
            <ActionButton>
              <Heart size={18} />
              Wishlist
            </ActionButton>
            <ActionButton>
              <Share2 size={18} />
              Share
            </ActionButton>
          </ActionButtons>
        </InfoSection>
      </ProductGrid>

      <ProductDetail product={product} />

      {/* Political Party Advertisement */}
      <AdBanner
        party="UDA Party"
        slogan="Together we can build a better Kenya 🇰🇪"
        link="/party/uda"
        icon="🇰🇪"
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default DetailView;
