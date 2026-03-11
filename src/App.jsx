import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import MiniCart from './components/cart/MiniCart';
import PromotionsBanner from './components/home/PromotionsBanner';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Product = lazy(() => import('./pages/Product'));
const Category = lazy(() => import('./pages/Category'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Search = lazy(() => import('./pages/Search'));
const Blog = lazy(() => import('./pages/Blog'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CmsPage = lazy(() => import('./pages/CmsPage'));

import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import { AuthProvider } from './contexts/AuthContext';
import Breadcrumbs from './components/common/Breadcrumbs';

function App() {
  return (
    <BreadcrumbProvider>
      <div className="app">
        <PromotionsBanner />
        <Header />
        <MiniCart />
        <Breadcrumbs />
        <main>
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #eee', borderTopColor: 'var(--primary-color)', borderRadius: '50%' }}></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:id" element={<Category />} />
              <Route path="/:url_key.html" element={<Category />} />
              <Route path="/product/:sku" element={<Product />} />
              <Route path="/cart" element={<Cart />} />
              {/* <Route path="/checkout" element={<Checkout />} /> */}
              <Route path="/search" element={<Search />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<PostDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/customer/account/createpassword/" element={<ResetPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/account" element={<Account />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/contact-us" element={<CmsPage identifier="contact-us" />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BreadcrumbProvider>
  );
}

export default App;
