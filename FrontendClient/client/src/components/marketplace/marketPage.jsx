// marketPage.jsx - Main Marketplace Component
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { CartProvider } from "./context/CartContext";

// Import components
import Header from "./components/Header/Header";
import Home from "./components/Home";
import Cart from "./components/Cart/Cart";
import DetailView from "./components/ItemDetails/DetailView";

const API_URL = "https://prisoners-brook-bands-dare.trycloudflare.com";

const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/products`);

        if (response.data.success) {
          setProducts(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || "Failed to load products");
        }
      } catch (err) {
        console.error("Error loading products:", err);
        setError(err.response?.data?.message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const styles = {
    content: {
      marginTop: "0px",
      backgroundColor: "#f5f5f5",
      minHeight: "calc(100vh - 60px)",
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0px",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
      flexDirection: "column",
      gap: "16px",
    },
    errorContainer: {
      textAlign: "center",
      padding: "40px",
      color: "#ff4444",
    },
    retryButton: {
      marginTop: "10px",
      padding: "8px 16px",
      background: "#bb0000",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
  };

  if (loading) {
    return (
      <CartProvider>
        <Header />
        <div style={styles.content}>
          <div style={styles.container}>
            <div style={styles.loadingContainer}>
              <Loader2
                size={48}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p>Loading campaign store...</p>
            </div>
          </div>
        </div>
      </CartProvider>
    );
  }

  if (error) {
    return (
      <CartProvider>
        <Header />
        <div style={styles.content}>
          <div style={styles.container}>
            <div style={styles.errorContainer}>
              <p>Error: {error}</p>
              <button
                onClick={() => window.location.reload()}
                style={styles.retryButton}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <Header />
      <div style={styles.content}>
        <div style={styles.container}>
          <Routes>
            <Route path="/" element={<Home products={products} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:id" element={<DetailView />} />
          </Routes>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </CartProvider>
  );
};

export default MarketplacePage;
