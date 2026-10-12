import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';

import Home from './pages/Home';
import Scan from './pages/Scan';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import NotFound from './pages/NotFound';

// The admin panel is only for the shop owner, so it's loaded on demand
// instead of being shipped to every visitor.
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminPages = lazy(() => import('./pages/admin/Pages'));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public site */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="scan" element={<Scan />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="admin-login" element={<Login adminOnly />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="about" element={<About />} />

          {/* Needs a signed-in customer */}
          <Route element={<RequireAuth />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin panel — own layout, admins only */}
        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pages" element={<AdminPages />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
