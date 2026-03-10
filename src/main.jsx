import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import App from './App.jsx'
import client from './api/client'
import { HelmetProvider } from 'react-helmet-async'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { WishlistProvider } from './contexts/WishlistContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './styles/main.css'
import './styles/mobile.css'
import './styles/tablet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <App />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </ApolloProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
