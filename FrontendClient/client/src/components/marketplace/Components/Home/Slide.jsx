import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Eye } from "lucide-react";

// Use the same API_URL as your main marketplace
const API_URL = "https://prisoners-brook-bands-dare.trycloudflare.com";

const Container = styled.div`
  margin: 10px 0;
  background: white;
  border-radius: 10px;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #212121;
`;

const Timer = styled.div`
  font-size: 14px;
  color: #bb0000;
  font-weight: 500;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const ProductCard = styled.div`
  background: white;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  background: #f5f5f5;
  border-radius: 10px;

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const ProductInfo = styled.div`
  padding: 12px;
`;

const ProductName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #212121;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #bb0000;
  margin: 8px 0;
`;

const OriginalPrice = styled.span`
  font-size: 12px;
  color: #878787;
  text-decoration: line-through;
  margin-left: 8px;
  font-weight: normal;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const OrderButton = styled.button`
  flex: 1;
  background: #bb0000;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;

  &:hover {
    background: #990000;
  }
`;

const ViewButton = styled(Link)`
  flex: 1;
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #e0e0e0;
    color: #333;
  }
`;

const ViewAllLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2874f0;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    color: #bb0000;
  }
`;

// Improved image URL helper with better error handling
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log("No image path provided");
    return null;
  }

  // If it's already a full URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    console.log("Using full URL:", imagePath);
    return imagePath;
  }

  // If it's an absolute path starting with /
  if (imagePath.startsWith("/")) {
    const fullUrl = `${API_URL}${imagePath}`;
    console.log("Absolute path converted to:", fullUrl);
    return fullUrl;
  }

  // Otherwise, treat as relative path
  const fullUrl = `${API_URL}/${imagePath}`;
  console.log("Relative path converted to:", fullUrl);
  return fullUrl;
};

const Slide = ({ data, title, timer, multi, onAddToCart }) => {
  const getTimerDisplay = () => {
    if (!timer) return null;

    const endTime = new Date();
    endTime.setHours(23, 59, 59);
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const displayProducts = multi ? data?.slice(0, 8) : data?.slice(0, 4);

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      // Default add to cart behavior
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

  if (!data || data.length === 0) {
    return (
      <Container>
        <Header>
          <Title>{title}</Title>
        </Header>
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          No products available in this category yet
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>{title}</Title>
        {timer && <Timer>Ends in: {getTimerDisplay()}</Timer>}
        {data.length > 4 && (
          <ViewAllLink to="/marketplace">
            View All <ChevronRight size={16} />
          </ViewAllLink>
        )}
      </Header>

      <ProductsGrid>
        {displayProducts.map((product) => {
          const imageUrl = getImageUrl(product.image);

          // Debug log for first product only
          if (product.id === displayProducts[0]?.id) {
            console.log("Product image path:", product.image);
            console.log("Constructed image URL:", imageUrl);
          }

          return (
            <ProductCard key={product.id}>
              <Link to={`/marketplace/product/${product.id}`}>
                <ProductImage
                  src={
                    imageUrl ||
                    "https://via.placeholder.com/200x180?text=No+Image"
                  }
                  alt={product.name}
                  onError={(e) => {
                    console.error(
                      `Failed to load image for product ${product.id}:`,
                      imageUrl,
                    );
                    e.target.src =
                      "https://via.placeholder.com/200x180?text=No+Image";
                  }}
                />
              </Link>
              <ProductInfo>
                <Link
                  to={`/marketplace/product/${product.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <ProductName>{product.name}</ProductName>
                </Link>
                <ProductPrice>
                  KES {product.price}
                  {product.mrp && product.mrp > product.price && (
                    <OriginalPrice>KES {product.mrp}</OriginalPrice>
                  )}
                </ProductPrice>
                <ButtonGroup>
                  <OrderButton onClick={() => handleAddToCart(product)}>
                    <ShoppingCart size={14} />
                    Order
                  </OrderButton>
                  <ViewButton to={`/marketplace/product/${product.id}`}>
                    <Eye size={14} />
                    View
                  </ViewButton>
                </ButtonGroup>
              </ProductInfo>
            </ProductCard>
          );
        })}
      </ProductsGrid>
    </Container>
  );
};

export default Slide;
