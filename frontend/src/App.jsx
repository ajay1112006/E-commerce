import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Package, Trash2 } from 'lucide-react'
import VariableProximity from './components/VariableProximity'
import './App.css'

const PRODUCTS = [
  { id: 1, name: 'Apple MacBook Pro M3', price: 169900, image: '/laptop.png', description: 'The ultimate pro laptop for demanding workflows.' },
  { id: 2, name: 'iPhone 15 Pro Max', price: 149900, image: '/smartphone.png', description: 'Titanium design, the most powerful iPhone yet.' },
  { id: 3, name: 'Rolex Submariner', price: 845000, image: '/watch.png', description: 'The reference among divers watches.' },
  { id: 4, name: 'Sony WH-1000XM5', price: 29990, image: '/sony_headphones.png', description: 'Industry-leading noise cancellation.' },
  { id: 5, name: 'Logitech G Pro Keyboard', price: 12995, image: '/logitech_keyboard.png', description: 'Built for pros with mechanical precision.' },
  { id: 6, name: 'Canon EOS R5 Camera', price: 339990, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', description: 'Professional mirrorless redefined.' },
  { id: 7, name: 'Dyson V15 Detect', price: 65900, image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=800', description: 'Most powerful, intelligent cordless vacuum.' },
  { id: 8, name: 'Herman Miller Aeron', price: 175000, image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800', description: 'The gold standard in ergonomic seating.' },
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

function Navbar({ orderCount }) {
  const containerRef = useRef(null);
  return (
    <nav className="navbar glass-morphism" ref={containerRef}>
      <Link to="/" className="logo-link">
        <VariableProximity
          label={'FutureStore'}
          className={'logo-text'}
          fromFontVariationSettings="'wght' 400, 'opsz' 9"
          toFontVariationSettings="'wght' 1000, 'opsz' 40"
          containerRef={containerRef}
          radius={100}
          falloff='linear'
        />
      </Link>
      <Link to="/orders" className="cart-button">
        <ShoppingCart size={24} />
        {orderCount > 0 && <span className="badge">{orderCount}</span>}
      </Link>
    </nav>
  )
}

function HomePage({ placeOrder, loading }) {
  const heroRef = useRef(null);
  return (
    <div className="page-content">
      <header className="hero-section" ref={heroRef}>
        <div className="gradient-title-wrapper">
          <VariableProximity
            label={'FutureStore'}
            className={'gradient-text'}
            fromFontVariationSettings="'wght' 400, 'opsz' 9"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            containerRef={heroRef}
            radius={200}
            falloff='exponential'
          />
        </div>
        <p className="subtitle">Premium Electronics for the Modern World</p>
      </header>
      <section className="products-grid">
        {PRODUCTS.map(product => (
          <div key={product.id} className="product-card glass-morphism">
            <div className="image-container">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="description">{product.description}</p>
              <div className="price-tag">{formatCurrency(product.price)}</div>
              <button 
                className="buy-button" 
                onClick={() => placeOrder(product)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Order Now'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function OrdersPage({ orders, deleteOrder }) {
  const navigate = useNavigate()

  return (
    <div className="page-content">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back to Store
      </button>
      
      <section className="orders-section glass-morphism">
        <h2><Package size={28} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Order History</h2>
        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet. Start shopping!</p>
            <Link to="/" className="shop-link">Browse Products</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-item">
                <div className="order-details">
                  <span className="order-name">{order.productName}</span>
                  <span className="order-date">{new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <div className="order-meta">
                  <div className="order-actions">
                    <span className="order-status">{order.status}</span>
                    <button 
                      className="delete-button" 
                      onClick={() => deleteOrder(order.id)}
                      title="Cancel Order"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="order-price">{formatCurrency(order.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.reverse())
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const placeOrder = async (product) => {
    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          price: product.price,
          quantity: 1
        })
      })

      if (response.ok) {
        setNotification({ message: `Successfully ordered ${product.name}!`, type: 'success' })
        fetchOrders()
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ message: 'Failed to place order.', type: 'error' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      setNotification({ message: 'Error connecting to backend.', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotification({ message: 'Order removed successfully.', type: 'success' })
        fetchOrders()
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ message: 'Failed to remove order.', type: 'error' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      setNotification({ message: 'Error connecting to backend.', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  return (
    <div className="app-container">
      {notification && (
        <div className={`notification glass-morphism ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <Navbar orderCount={orders.length} />

      <main>
        <Routes>
          <Route path="/" element={<HomePage placeOrder={placeOrder} loading={loading} />} />
          <Route path="/orders" element={<OrdersPage orders={orders} deleteOrder={deleteOrder} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
