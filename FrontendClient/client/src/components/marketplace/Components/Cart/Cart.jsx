import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ShoppingCart, CreditCard, Loader2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "./CartItem";
import TotalView from "./TotalView";
import EmptyCart from "./EmptyCart";

const API_URL = "http://localhost:8000";

// Styled Components
const CartWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 200px);
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 24px;
  transition: color 0.2s;

  &:hover {
    color: #bb0000;
  }
`;

const CartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const CartItemsSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1a1a2e;
`;

const CartFooter = styled.div`
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
`;

const CheckoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #bb0000;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #990000;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  flex-direction: column;
  gap: 16px;
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  color: #bb0000;
`;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem("marketplace_cart");
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Error loading cart:", e);
        }
      }
      setLoading(false);
    };
    loadCart();
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("marketplace_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, loading]);

  const removeItemFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItemFromCart(id);
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
      );
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const handleCheckout = () => {
    alert(
      `Total: KES ${getTotalPrice().toLocaleString()}. Checkout coming soon!`,
    );
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <Spinner size={40} />
        <div>Loading your cart...</div>
      </LoadingWrapper>
    );
  }

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <CartWrapper>
      <BackButton to="/marketplace">
        <ArrowLeft size={18} />
        Continue Shopping
      </BackButton>

      <CartGrid>
        <CartItemsSection>
          <SectionHeader>
            <SectionTitle>
              <ShoppingCart size={20} />
              My Cart ({getTotalItems()}{" "}
              {getTotalItems() === 1 ? "item" : "items"})
            </SectionTitle>
          </SectionHeader>

          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              removeItemFromCart={removeItemFromCart}
              updateQuantity={updateQuantity}
            />
          ))}

          <CartFooter>
            <CheckoutButton onClick={handleCheckout}>
              <CreditCard size={18} />
              Proceed to Checkout · KES {getTotalPrice().toLocaleString()}
            </CheckoutButton>
          </CartFooter>
        </CartItemsSection>

        <TotalView cartItems={cartItems} />
      </CartGrid>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </CartWrapper>
  );
};

export default Cart;
