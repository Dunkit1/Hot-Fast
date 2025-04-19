import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const location = useLocation();
  
  // Update the paths where Navbar should be hidden
 const hideNavbarPaths = [

  ];

  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#1a1d24]">
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
       
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
