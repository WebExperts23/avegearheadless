import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    CreditCard, 
    Truck, 
    User, 
    MapPin, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    ShoppingBag,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { 
    GET_CHECKOUT_DETAILS, 
    SET_GUEST_EMAIL, 
    SET_SHIPPING_ADDRESS, 
    SET_SHIPPING_METHOD, 
    SET_PAYMENT_METHOD, 
    PLACE_ORDER,
    SET_BILLING_ADDRESS
} from '../api/checkout';
import '../styles/checkout.css';

const Checkout = () => {
    const { cartId, cartItems, cartTotals, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [address, setAddress] = useState({
        firstname: '',
        lastname: '',
        street: '',
        city: '',
        region: '',
        postcode: '',
        country_code: 'US',
        telephone: ''
    });

    // CC State
    const [ccInfo, setCcInfo] = useState({
        number: '',
        expiry: '',
        cvv: ''
    });

    const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [orderNumber, setOrderNumber] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [error, setError] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // PayPal Ref
    const paypalRef = useRef();
    const [paypalLoaded, setPaypalLoaded] = useState(false);

    // Queries & Mutations
    const { data: checkoutData, loading: fetchingDetails, refetch: refetchDetails } = useQuery(GET_CHECKOUT_DETAILS, {
        variables: { cartId: cartId || '' },
        skip: !cartId,
        onCompleted: (data) => {
            if (data.cart) {
                if (data.cart.email) setEmail(data.cart.email);
                const shipAddr = data.cart.shipping_addresses?.[0];
                if (shipAddr && shipAddr.firstname) {
                    setAddress({
                        firstname: shipAddr.firstname,
                        lastname: shipAddr.lastname,
                        street: shipAddr.street[0] || '',
                        city: shipAddr.city,
                        region: shipAddr.region?.code || '',
                        postcode: shipAddr.postcode,
                        country_code: shipAddr.country?.code || 'US',
                        telephone: shipAddr.telephone
                    });
                }
                const selMethod = shipAddr?.selected_shipping_method;
                if (selMethod) setSelectedShippingMethod(`${selMethod.carrier_code}_${selMethod.method_code}`);
                
                const selPayment = data.cart.selected_payment_method;
                if (selPayment) setSelectedPaymentMethod(selPayment.code);
            }
        }
    });

    const [setGuestEmail] = useMutation(SET_GUEST_EMAIL);
    const [setShippingAddress] = useMutation(SET_SHIPPING_ADDRESS);
    const [setBillingAddress] = useMutation(SET_BILLING_ADDRESS);
    const [setShippingMethod] = useMutation(SET_SHIPPING_METHOD);
    const [setPaymentMethod] = useMutation(SET_PAYMENT_METHOD);
    const [placeOrderMutation] = useMutation(PLACE_ORDER);

    // Load PayPal SDK
    useEffect(() => {
        if (selectedPaymentMethod === 'paypal_express' && !window.paypal) {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=sb&currency=USD`; // Using sandbox for now
            script.addEventListener('load', () => setPaypalLoaded(true));
            document.body.appendChild(script);
        } else if (window.paypal) {
            setPaypalLoaded(true);
        }
    }, [selectedPaymentMethod]);

    // Initialize PayPal Buttons
    useEffect(() => {
        if (paypalLoaded && selectedPaymentMethod === 'paypal_express' && paypalRef.current) {
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: cartTotals?.grand_total?.value.toFixed(2)
                            }
                        }]
                    });
                },
                onApprove: async (data, actions) => {
                    setIsPlacingOrder(true);
                    try {
                        // In real Magento, we'd send the PayPal token to setPaymentMethod
                        await handlePlaceOrder();
                    } catch (err) {
                        setError("PayPal payment failed to process.");
                    } finally {
                        setIsPlacingOrder(false);
                    }
                },
                onError: (err) => {
                    setError("PayPal SDK Error: " + err.message);
                }
            }).render(paypalRef.current);
        }
    }, [paypalLoaded, selectedPaymentMethod, cartTotals]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleCcChange = (e) => {
        const { name, value } = e.target;
        setCcInfo(prev => ({ ...prev, [name]: value }));
    };

    // Auto-save address when fields are blurred to update shipping methods
    const handleBlur = async () => {
        const isComplete = address.firstname && address.lastname && address.street && address.city && address.postcode && address.telephone;
        if (isComplete) {
            setIsSyncing(true);
            try {
                if (!user && email) await setGuestEmail({ variables: { cartId, email } });
                
                const addrInput = {
                    firstname: address.firstname,
                    lastname: address.lastname,
                    street: [address.street],
                    city: address.city,
                    region: address.region,
                    postcode: address.postcode,
                    country_code: address.country_code,
                    telephone: address.telephone,
                    save_in_address_book: false
                };

                await setShippingAddress({ variables: { cartId, address: addrInput } });
                await setBillingAddress({ variables: { cartId, address: addrInput } });
                await refetchDetails();
            } catch (err) {
                console.warn("Address sync failed:", err.message);
            } finally {
                setIsSyncing(false);
            }
        }
    };

    const handleShippingMethodSelect = async (methodCode, carrierCode) => {
        try {
            setError(null);
            setSelectedShippingMethod(`${carrierCode}_${methodCode}`);
            await setShippingMethod({ 
                variables: { 
                    cartId, 
                    method: { carrier_code: carrierCode, method_code: methodCode } 
                } 
            });
            await refetchDetails();
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePaymentMethodSelect = async (code) => {
        try {
            setError(null);
            setSelectedPaymentMethod(code);
            await setPaymentMethod({ 
                variables: { 
                    cartId, 
                    paymentMethod: { code } 
                } 
            });
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        setError(null);
        try {
            const res = await placeOrderMutation({ variables: { cartId } });
            const num = res.data.placeOrder.order.order_number;
            setOrderNumber(num);
            clearCart();
        } catch (err) {
            setError(err.message);
            setIsPlacingOrder(false);
        }
    };

    if (orderNumber) {
        return (
            <div className="checkout-container">
                <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <div className="checkout-section" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', background: '#f0fff4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={48} color="#00a651" />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px' }}>Thank you for your purchase!</h1>
                        <p style={{ color: '#666', marginBottom: '8px' }}>Your order number is: <strong>#{orderNumber}</strong></p>
                        <p style={{ color: '#888', marginBottom: '32px' }}>We'll email you an order confirmation with details and tracking info.</p>
                        <Link to="/" className="button primary" style={{ padding: '15px 40px' }}>Continue Shopping</Link>
                    </div>
                </div>
            </div>
        );
    }

    const availableMethods = checkoutData?.cart?.shipping_addresses?.[0]?.available_shipping_methods || [];
    const availablePayments = checkoutData?.cart?.available_payment_methods || [];

    return (
        <div className="checkout-container">
            <div className="container">
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1a1a1a', marginBottom: '10px' }}>One Step Checkout</h1>
                    <p style={{ color: '#666' }}>Please fill in the details below to complete your order.</p>
                </div>

                <div className="checkout-grid">
                    {/* Column 1: Shipping Address */}
                    <div className="checkout-column">
                        <div className="checkout-section">
                            <h2><span className="step-num">1</span> Shipping Address</h2>
                            <div className="checkout-form">
                                {!user && (
                                    <div className="form-group">
                                        <label>Email Address *</label>
                                        <input 
                                            type="email" 
                                            value={email} 
                                            onChange={(e) => setEmail(e.target.value)}
                                            onBlur={handleBlur}
                                            required
                                        />
                                    </div>
                                )}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input type="text" name="firstname" value={address.firstname} onChange={handleInputChange} onBlur={handleBlur} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name *</label>
                                        <input type="text" name="lastname" value={address.lastname} onChange={handleInputChange} onBlur={handleBlur} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Street Address *</label>
                                    <input type="text" name="street" value={address.street} onChange={handleInputChange} onBlur={handleBlur} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City *</label>
                                        <input type="text" name="city" value={address.city} onChange={handleInputChange} onBlur={handleBlur} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Zip/Postal Code *</label>
                                        <input type="text" name="postcode" value={address.postcode} onChange={handleInputChange} onBlur={handleBlur} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Region/State</label>
                                        <input type="text" name="region" value={address.region} onChange={handleInputChange} onBlur={handleBlur} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number *</label>
                                        <input type="tel" name="telephone" value={address.telephone} onChange={handleInputChange} onBlur={handleBlur} required />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Methods */}
                    <div className="checkout-column">
                        <div className="checkout-section">
                            <h2><span className="step-num">2</span> Shipping Method</h2>
                            {isSyncing || fetchingDetails ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" color="var(--primary-color)" /></div>
                            ) : (
                                <div className="methods-list">
                                    {availableMethods.length > 0 ? availableMethods.map(m => (
                                        <div 
                                            key={`${m.carrier_code}_${m.method_code}`}
                                            className={`shipping-method-item ${selectedShippingMethod === `${m.carrier_code}_${m.method_code}` ? 'selected' : ''}`}
                                            onClick={() => handleShippingMethodSelect(m.method_code, m.carrier_code)}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{m.carrier_title}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{m.method_title}</div>
                                            </div>
                                            <div style={{ fontWeight: '700' }}>${m.amount.value.toFixed(2)}</div>
                                        </div>
                                    )) : <p style={{ fontSize: '13px', color: '#999' }}>Please enter your address to see shipping methods.</p>}
                                </div>
                            )}
                        </div>

                        <div className="checkout-section">
                            <h2><span className="step-num">3</span> Payment Method</h2>
                            <div className="methods-list">
                                {availablePayments.length > 0 ? availablePayments.map(p => (
                                    <div key={p.code}>
                                        <div 
                                            className={`payment-method-item ${selectedPaymentMethod === p.code ? 'selected' : ''}`}
                                            onClick={() => handlePaymentMethodSelect(p.code)}
                                        >
                                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{p.title}</div>
                                        </div>

                                        {/* Dynamic UI for special methods */}
                                        {selectedPaymentMethod === p.code && p.code === 'payflowpro' && (
                                            <div className="payment-details cc-form">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', fontWeight: '700' }}>
                                                    <Lock size={14} /> Secure Card Payment
                                                </div>
                                                <div className="form-group">
                                                    <label>Card Number</label>
                                                    <input type="text" name="number" placeholder="0000 0000 0000 0000" value={ccInfo.number} onChange={handleCcChange} />
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Expiry (MM/YY)</label>
                                                        <input type="text" name="expiry" placeholder="MM/YY" value={ccInfo.expiry} onChange={handleCcChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>CVV</label>
                                                        <input type="text" name="cvv" placeholder="123" value={ccInfo.cvv} onChange={handleCcChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedPaymentMethod === p.code && p.code === 'paypal_express' && (
                                            <div className="payment-details">
                                                <div ref={paypalRef} className="paypal-button-container"></div>
                                            </div>
                                        )}
                                    </div>
                                )) : <p style={{ fontSize: '13px', color: '#999' }}>Please select a shipping method first.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Review & Summary */}
                    <div className="checkout-column">
                        <div className="checkout-section">
                            <h2><span className="step-num">4</span> Order Review</h2>
                            <div className="order-review-table">
                                {cartItems.map(item => (
                                    <div key={item.id} className="review-item">
                                        <div className="review-item-img">
                                            <img src={item.product.thumbnail?.url || item.product.small_image?.url} alt={item.product.name} />
                                        </div>
                                        <div className="review-item-info">
                                            <div className="review-item-name">{item.product.name}</div>
                                            <div className="review-item-qty">Qty: {item.quantity}</div>
                                        </div>
                                        <div className="review-item-price">
                                            ${(item.product.price_range.minimum_price.final_price.value * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="order-summary-card">
                                <div className="summary-item">
                                    <span>Subtotal</span>
                                    <span>${cartTotals?.subtotal_excluding_tax?.value.toFixed(2)}</span>
                                </div>
                                {checkoutData?.cart?.shipping_addresses?.[0]?.selected_shipping_method && (
                                    <div className="summary-item">
                                        <span>Shipping</span>
                                        <span>${checkoutData.cart.shipping_addresses[0].selected_shipping_method.amount.value.toFixed(2)}</span>
                                    </div>
                                )}
                                {cartTotals?.discounts?.length > 0 && cartTotals.discounts.map((d, i) => (
                                    <div key={i} className="summary-item" style={{ color: '#00a651', fontWeight: '700' }}>
                                        <span>Discount</span>
                                        <span>-${d.amount.value.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="summary-total">
                                    <span>Total</span>
                                    <span>${cartTotals?.grand_total?.value.toFixed(2)}</span>
                                </div>

                                {selectedPaymentMethod !== 'paypal_express' && (
                                    <button 
                                        className="place-order-btn"
                                        onClick={handlePlaceOrder}
                                        disabled={!selectedShippingMethod || !selectedPaymentMethod || isPlacingOrder}
                                    >
                                        {isPlacingOrder ? <Loader2 className="animate-spin" size={20} /> : 'PLACE ORDER NOW'}
                                    </button>
                                )}

                                {error && (
                                    <div style={{ color: '#d32f2f', background: '#fffafa', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginTop: '15px', fontSize: '13px' }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#00a651', fontSize: '12px' }}>
                                    <ShieldCheck size={16} /> <span>Secure Checkout Guaranteed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
