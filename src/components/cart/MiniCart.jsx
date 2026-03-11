import React, { useEffect, useRef } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Link } from 'react-router-dom';
import { X, Trash2 } from 'lucide-react';

const MiniCart = () => {
    const { isCartOpen, setIsCartOpen, cartItems, removeFromCart } = useCart();
    const overlayRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target)) {
                setIsCartOpen(false);
            }
        };

        if (isCartOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCartOpen, setIsCartOpen]);

    if (!isCartOpen) return null;

    const total = cartItems.reduce((acc, item) => {
        const regularPrice = item.product.price_range.minimum_price.regular_price.value;
        const finalPriceNode = item.product.price_range.minimum_price.final_price;
        const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
        return acc + (currentPrice * item.quantity);
    }, 0);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div ref={overlayRef} style={{
                width: '400px',
                maxWidth: '100%',
                height: '100%',
                backgroundColor: 'white',
                boxShadow: '-5px 0 15px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideIn 0.3s ease-out'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Shopping Cart ({cartItems.length})</h2>
                    <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {cartItems.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Your cart is empty.</p>
                    ) : (
                        cartItems.map((item) => {
                            const imageUrl =
                                item.product.thumbnail?.url ||
                                item.product.small_image?.url ||
                                item.product.media_gallery?.[0]?.url ||
                                null;

                            const regularPrice = item.product.price_range.minimum_price.regular_price.value;
                            const finalPriceNode = item.product.price_range.minimum_price.final_price;
                            const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;

                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No IMG</div>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 5px', fontSize: '0.9rem', lineHeight: '1.4' }}>{item.product.name}</h4>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#666' }}>Qty: {item.quantity}</span>
                                            <span style={{ fontWeight: 'bold' }}>
                                                {item.product.price_range.minimum_price.regular_price.currency}
                                                {(currentPrice * item.quantity).toFixed(2)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '0.8rem', cursor: 'pointer', marginTop: '5px', padding: 0 }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        <span>Subtotal:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <Link
                        to="/cart"
                        onClick={() => setIsCartOpen(false)}
                        className="button primary"
                        style={{ display: 'block', textAlign: 'center', width: '100%', padding: '12px', borderRadius: '4px', textDecoration: 'none', marginBottom: '10px' }}
                    >
                        View Cart
                    </Link>
                    <a
                        href="/checkout"
                        onClick={() => setIsCartOpen(false)}
                        className="button primary"
                        style={{ display: 'block', textAlign: 'center', width: '100%', padding: '12px', borderRadius: '4px', textDecoration: 'none' }}
                    >
                        Proceed to Checkout
                    </a>
                </div>
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MiniCart;
