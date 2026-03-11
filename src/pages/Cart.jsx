import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import {
    Trash2,
    ShoppingBag,
    ArrowRight,
    ShieldCheck,
    Minus,
    Plus,
    ChevronLeft,
    Tag,
    X
} from 'lucide-react';
import { gql, useMutation, useQuery } from '@apollo/client';

const APPLY_COUPON = gql`
  mutation ApplyCoupon($cartId: String!, $couponCode: String!) {
    applyCouponToCart(input: { cart_id: $cartId, coupon_code: $couponCode }) {
      cart {
        id
        applied_coupons { code }
        prices {
          discounts {
            amount { value }
            label
          }
          grand_total { value }
        }
      }
    }
  }
`;

const REMOVE_COUPON = gql`
  mutation RemoveCoupon($cartId: String!) {
    removeCouponFromCart(input: { cart_id: $cartId }) {
      cart {
        id
        applied_coupons { code }
        prices {
          discounts {
            amount { value }
            label
          }
          grand_total { value }
        }
      }
    }
  }
`;

const GET_CART_TOTALS = gql`
    query GetCartTotals($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            applied_coupons { code }
            prices {
                grand_total { value }
                discounts {
                    amount { value }
                    label
                }
            }
        }
    }
`;

const Cart = () => {
    const { cartItems, removeFromCart, addToCart, cartId } = useCart();
    const [couponCode, setCouponCode] = React.useState('');
    const [couponError, setCouponError] = React.useState('');

    const [applyCoupon, { loading: applying }] = useMutation(APPLY_COUPON);
    const [removeCoupon, { loading: removing }] = useMutation(REMOVE_COUPON);

    const { data: cartData, refetch: refetchCart } = useQuery(GET_CART_TOTALS, {
        variables: { cartId },
        skip: !cartId,
        fetchPolicy: 'network-only' // Ensure we get latest discounts
    });

    const subtotal = cartItems.reduce((acc, item) => {
        const regularPrice = item.product.price_range.minimum_price.regular_price.value;
        const finalPriceNode = item.product.price_range.minimum_price.final_price;
        const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
        return acc + (currentPrice * item.quantity);
    }, 0);

    const appliedCoupons = cartData?.cart?.applied_coupons || [];
    const discounts = cartData?.cart?.prices?.discounts || [];

    // If the backend returns a discounted grand_total, use it, otherwise fallback
    const total = cartData?.cart?.prices?.grand_total?.value || subtotal;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');
        try {
            await applyCoupon({ variables: { cartId, couponCode } });
            setCouponCode('');
            refetchCart();
        } catch (err) {
            setCouponError(err.message || 'Failed to apply coupon.');
        }
    };

    const handleRemoveCoupon = async () => {
        setCouponError('');
        try {
            await removeCoupon({ variables: { cartId } });
            refetchCart();
        } catch (err) {
            setCouponError(err.message || 'Failed to remove coupon.');
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-page" style={{ background: '#f8f9fa', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <div style={{ background: 'white', padding: '60px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '500px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <ShoppingBag size={40} style={{ color: '#ccc' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a' }}>Your cart is empty</h2>
                        <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>Looks like you haven't added any premium gear to your cart yet. Browse our latest collections to find what you need.</p>
                        <Link to="/" className="button primary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '50px' }}>
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page" style={{ background: '#f8f9fa', minHeight: '100vh', padding: '60px 0' }}>
            <div className="container">
                <div style={{ marginBottom: '40px' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginBottom: '16px' }}>
                        <ChevronLeft size={16} /> Continue Shopping
                    </Link>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a1a1a' }}>Shopping Cart</h1>
                    <p style={{ color: '#666' }}>You have {cartItems.length} items in your cart</p>
                </div>

                <div className="cart-main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
                    {/* Items List */}
                    <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {cartItems.map(item => (
                            <div key={item.id} className="checkout-card cart-item-row" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px' }}>
                                {/* Product Image */}
                                <div style={{ width: '120px', height: '120px', background: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(item.product.thumbnail?.url || item.product.small_image?.url || item.product.media_gallery?.[0]?.url) ? (
                                        <img
                                            src={item.product.thumbnail?.url || item.product.small_image?.url || item.product.media_gallery[0].url}
                                            alt={item.product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div style={{ color: '#ccc', fontSize: '12px' }}>No Image</div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="cart-item-details" style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                                        {item.product.sku}
                                    </div>
                                    <h3 className="cart-item-title" style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>{item.product.name}</h3>

                                    <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                                        {/* Quantity Selector */}
                                        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: '30px', padding: '4px' }}>
                                            <button
                                                onClick={() => removeFromCart(item.id, 1)}
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span style={{ padding: '0 16px', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button
                                                onClick={() => addToCart(item.product, 1)}
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}
                                        >
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="cart-item-price" style={{ textAlign: 'right', minWidth: '100px' }}>
                                    {(() => {
                                        const regularPrice = item.product.price_range.minimum_price.regular_price.value;
                                        const finalPriceNode = item.product.price_range.minimum_price.final_price;
                                        const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
                                        const isDiscounted = currentPrice < regularPrice;

                                        return (
                                            <>
                                                {isDiscounted && (
                                                    <div style={{ fontSize: '1rem', color: '#888', textDecoration: 'line-through' }}>
                                                        ${(regularPrice * item.quantity).toFixed(2)}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isDiscounted ? '#d32f2f' : '#1a1a1a' }}>
                                                    ${(currentPrice * item.quantity).toFixed(2)}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#888' }}>
                                                    ${currentPrice.toFixed(2)} each
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="cart-summary-sidebar">
                        <div className="checkout-card cart-summary-card" style={{ padding: '32px', position: 'sticky', top: '20px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>Summary</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                                    <span>Subtotal</span>
                                    <span style={{ fontWeight: '700', color: '#1a1a1a' }}>${subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                                    <span>Estimated Shipping</span>
                                    <span style={{ fontWeight: '700', color: '#1a1a1a' }}>Calculated at checkout</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                                    <span>Tax</span>
                                    <span style={{ fontWeight: '700', color: '#1a1a1a' }}>$0.00</span>
                                </div>

                                {discounts.length > 0 && discounts.map((discount, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#00a651', fontWeight: 'bold' }}>
                                        <span>Discount ({discount.label})</span>
                                        <span>-${discount.amount.value.toFixed(2)}</span>
                                    </div>
                                ))}

                                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>Order Total</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-color)' }}>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Coupon Code Section */}
                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem' }}>
                                    <Tag size={16} /> Have a promotional code?
                                </h4>

                                {appliedCoupons.length > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fff4', padding: '12px', border: '1px solid #c6f6d5', borderRadius: '8px' }}>
                                        <div style={{ color: '#00a651', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Tag size={14} /> {appliedCoupons[0].code}
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            disabled={removing}
                                            style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            title="Remove Coupon"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={applying || !couponCode.trim()}
                                                style={{ padding: '0 20px', borderRadius: '8px', background: '#1a1a1a', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (applying || !couponCode.trim()) ? 0.7 : 1 }}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '8px' }}>{couponError}</div>}
                                    </>
                                )}
                            </div>

                            <a
                                href="/checkout"
                                className="button primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    width: '100%',
                                    marginTop: '32px',
                                    padding: '18px',
                                    borderRadius: '12px',
                                    fontSize: '1.1rem',
                                    fontWeight: '800',
                                    textDecoration: 'none'
                                }}
                            >
                                Checkout Now <ArrowRight size={20} />
                            </a>

                            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fff4', borderRadius: '12px', color: '#00a651', fontSize: '13px' }}>
                                <ShieldCheck size={20} />
                                <span>100% Secure Checkout Guaranteed</span>
                            </div>

                            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>We Accept</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '24px', opacity: 0.6 }}>
                                    <span>💳</span> <span>🅿️</span> <span>🏦</span> <span>🍎</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
