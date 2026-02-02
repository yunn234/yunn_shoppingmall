import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Admin from './pages/admin/Admin';
import ProductList from './pages/admin/ProductList';
import ProductRegister from './pages/admin/ProductRegister';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailure from './pages/OrderFailure';
import OrderList from './pages/OrderList';
import AdminOrderList from './pages/admin/AdminOrderList';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<ProductList />} />
        <Route path="/admin/products/register" element={<ProductRegister />} />
        <Route path="/admin/orders" element={<AdminOrderList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/success" element={<OrderSuccess />} />
        <Route path="/orders/failure" element={<OrderFailure />} />
        <Route path="/orders/my" element={<OrderList />} />
      </Routes>
    </Router>
  );
}

export default App;
