import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AdminDashboard from "./components/AdminDashboard";
import InventoryManagement from "./pages/InventoryManagement";
import InventoryRelease from "./pages/InventoryRelease";
import PurchaseManagement from "./pages/PurchaseManagement";
import InventoryStock from "./pages/InventoryStock";
import ProductManagement from "./pages/ProductManagement";
import ImageUploadPage from './pages/ImageUploadPage';
import ProductInventoryRelease from "./pages/ProductInventoryRelease";
import RecipeManagement from "./pages/RecipeManagement";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const location = useLocation();
  
  // Update the paths where Navbar should be hidden
 const hideNavbarPaths = [
 "/admin-dashboard",
 "/inventory-management",
 "/inventory-release",
 "/purchase-management",
 "/inventory-stock",
  "/product-management",
  "/image-upload",
  "/product-inventory-release",
  "/recipe-management",
  ];

  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#1a1d24]">
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/inventory-management" element={<InventoryManagement />} />
        <Route path="/inventory-release" element={<InventoryRelease />} />
        <Route path="/purchase-management" element={<PurchaseManagement />} />
        <Route path="/inventory-stock" element={<InventoryStock />} />
        <Route path="/product-management" element={<ProductManagement />} />
        <Route path="/image-upload" element={<ImageUploadPage />} />
        <Route path="/product-inventory-release" element={<ProductInventoryRelease />} />
        <Route path="/recipe-management" element={<RecipeManagement />} />
        
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default App;
