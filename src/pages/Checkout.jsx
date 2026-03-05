import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import {
    User,
    MapPin,
    Truck,
    CreditCard,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
    ShoppingBag
} from 'lucide-react';
import { gql, useMutation, useApolloClient } from '@apollo/client';

const SET_GUEST_EMAIL_ON_CART = gql`
    mutation SetGuestEmail($cartId: String!, $email: String!) {
        setGuestEmailOnCart(input: { cart_id: $cartId, email: $email }) {
            cart { id }
        }
    }
`;

const SET_SHIPPING_ADDRESSES_ON_CART = gql`
    mutation SetShippingAddresses($cartId: String!, $shippingAddress: ShippingAddressInput!) {
        setShippingAddressesOnCart(input: { cart_id: $cartId, shipping_addresses: [$shippingAddress] }) {
            cart { id }
        }
    }
`;

const SET_BILLING_ADDRESS_ON_CART = gql`
    mutation SetBillingAddress($cartId: String!, $billingAddress: BillingAddressInput!) {
        setBillingAddressOnCart(input: { cart_id: $cartId, billing_address: $billingAddress }) {
            cart { id }
        }
    }
`;

const SET_SHIPPING_METHODS_ON_CART = gql`
    mutation SetShippingMethods($cartId: String!, $shippingMethod: ShippingMethodInput!) {
        setShippingMethodsOnCart(input: { cart_id: $cartId, shipping_methods: [$shippingMethod] }) {
            cart { id }
        }
    }
`;

const SET_PAYMENT_METHOD_ON_CART = gql`
    mutation SetPaymentMethod($cartId: String!, $paymentMethod: PaymentMethodInput!) {
        setPaymentMethodOnCart(input: { cart_id: $cartId, payment_method: $paymentMethod }) {
            cart { id }
        }
    }
`;

const PLACE_ORDER = gql`
    mutation PlaceOrder($cartId: String!) {
        placeOrder(input: { cart_id: $cartId }) {
            order { order_number }
        }
    }
`;

const GET_SHIPPING_METHODS = gql`
    query GetShippingMethods($cartId: String!) {
        cart(cart_id: $cartId) {
            shipping_addresses {
                available_shipping_methods {
                    carrier_code
                    method_code
                    carrier_title
                    method_title
                }
            }
        }
    }
`;

const GET_REGIONS = gql`
    query GetRegions($countryCode: String!) {
        country(id: $countryCode) {
            available_regions {
                id
                code
                name
            }
        }
    }
`;

const Checkout = () => {
    const { cartItems, clearCart, cartId } = useCart();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [mode, setMode] = useState('guest');
    const [orderNumber, setOrderNumber] = useState('');
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        street: '', city: '', region: 'NY', postcode: '', country: 'US',
        phone: '', shippingMethod: 'flatrate_flatrate', paymentMethod: 'checkmo'
    });

    // Mutations
    const [setGuestEmail] = useMutation(SET_GUEST_EMAIL_ON_CART);
    const [setShippingAddresses] = useMutation(SET_SHIPPING_ADDRESSES_ON_CART);
    const [setBillingAddress] = useMutation(SET_BILLING_ADDRESS_ON_CART);
    const [setShippingMethods] = useMutation(SET_SHIPPING_METHODS_ON_CART);
    const [setPaymentMethod] = useMutation(SET_PAYMENT_METHOD_ON_CART);
    const [placeOrderMutation] = useMutation(PLACE_ORDER);

    const [getShippingMethodsQuery] = useMutation(gql`
        mutation GetMethods($cartId: String!) {
            setShippingMethodsOnCart(input: { cart_id: $cartId, shipping_methods: [] }) {
                cart { id }
            }
        }
    `); // Dummy to trigger or just use useLazyQuery. I'll use useApolloClient for manual fetch.

    const client = useApolloClient();

    const subtotal = cartItems.reduce((acc, item) => {
        const regularPrice = item.product.price_range.minimum_price.regular_price.value;
        const finalPriceNode = item.product.price_range.minimum_price.final_price;
        const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
        return acc + (currentPrice * item.quantity);
    }, 0);
    // Flat Rate is usually flatrate_flatrate in Magento
    const shippingCost = step >= 2 ? (form.shippingMethod === 'express' ? 15.00 : 5.00) : 0;
    const total = subtotal + shippingCost;

    const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');

    const placeOrder = async () => {
        if (!cartId) {
            setError('Cart session expired. Please return to cart.');
            return;
        }

        setPlacing(true);
        setError('');

        try {
            console.log('Starting order placement flow for Cart:', cartId);

            // 1. Set Guest Email
            await setGuestEmail({ variables: { cartId, email: form.email } });
            console.log('Guest email set');

            // 2. Set Shipping Address
            // First, find the region_id if applicable (for US/CA)
            let regionId = null;
            if (['US', 'CA'].includes(form.country)) {
                const { data: regionData } = await client.query({
                    query: GET_REGIONS,
                    variables: { countryCode: form.country }
                });
                const regions = regionData?.country?.available_regions || [];
                const foundRegion = regions.find(r =>
                    r.code.toLowerCase() === form.region.toLowerCase() ||
                    r.name.toLowerCase() === form.region.toLowerCase()
                );
                if (foundRegion) {
                    regionId = parseInt(foundRegion.id);
                    console.log(`Mapped region ${form.region} to ID ${regionId}`);
                }
            }

            const addressInput = {
                firstname: form.firstName,
                lastname: form.lastName,
                street: [form.street],
                city: form.city,
                region: form.region,
                region_id: regionId,
                postcode: form.postcode,
                country_code: form.country,
                telephone: form.phone,
                save_in_address_book: false
            };

            await setShippingAddresses({
                variables: {
                    cartId,
                    shippingAddress: { address: addressInput }
                }
            });
            console.log('Shipping address set');

            // 3. Set Billing Address (same as shipping)
            await setBillingAddress({
                variables: {
                    cartId,
                    billingAddress: {
                        address: addressInput,
                        same_as_shipping: true
                    }
                }
            });
            console.log('Billing address set');

            // 4. Set Shipping Method
            // Fetch available methods first to avoid "method not found" errors
            const { data: shipData } = await client.query({
                query: GET_SHIPPING_METHODS,
                variables: { cartId },
                fetchPolicy: 'network-only'
            });

            const available = shipData?.cart?.shipping_addresses?.[0]?.available_shipping_methods || [];
            console.log('Available shipping methods:', available);

            if (available.length === 0) {
                throw new Error('No shipping methods available for this address.');
            }

            // Try to match selected or just pick first
            const selectedMethod = available.find(m => `${m.carrier_code}_${m.method_code}` === form.shippingMethod) || available[0];

            await setShippingMethods({
                variables: {
                    cartId,
                    shippingMethod: {
                        carrier_code: selectedMethod.carrier_code,
                        method_code: selectedMethod.method_code
                    }
                }
            });
            console.log('Shipping method set:', selectedMethod.carrier_code);

            // 5. Set Payment Method
            await setPaymentMethod({
                variables: {
                    cartId,
                    paymentMethod: { code: form.paymentMethod }
                }
            });
            console.log('Payment method set');

            // 6. Final Place Order
            const result = await placeOrderMutation({ variables: { cartId } });
            const orderNum = result.data.placeOrder.order.order_number;
            console.log('Order PLACED! Order Number:', orderNum);

            setOrderNumber(orderNum);
            clearCart();
            setStep(5);
        } catch (err) {
            console.error('Checkout failed:', err);
            setError(err.message || 'An error occurred during checkout. Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    if (cartItems.length === 0 && step < 5) {
        return (
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                <ShoppingBag size={64} style={{ color: '#ccc', marginBottom: '20px' }} />
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Your cart is empty</h2>
                <p style={{ color: '#666', marginBottom: '30px' }}>Add some premium gear to your cart to checkout.</p>
                <Link to="/" className="button primary">Start Shopping</Link>
            </div>
        );
    }

    const StepIndicator = () => (
        <div className="checkout-steps">
            {[
                { n: 1, label: 'Account', icon: <User size={18} /> },
                { n: 2, label: 'Shipping', icon: <MapPin size={18} /> },
                { n: 3, label: 'Payment', icon: <CreditCard size={18} /> },
                { n: 4, label: 'Review', icon: <ShieldCheck size={18} /> }
            ].map(s => (
                <div key={s.n} className={`step-item ${step === s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}`}>
                    <div className="step-number">
                        {step > s.n ? <CheckCircle size={20} /> : s.icon}
                    </div>
                    <span>{s.label}</span>
                </div>
            ))}
        </div>
    );

    const OrderSummary = () => (
        <div className="checkout-card" style={{ position: 'sticky', top: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={20} /> Order Summary
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {cartItems.map(it => (
                    <div key={it.id} style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f9f9f9' }}>
                        <div style={{ width: '60px', height: '60px', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {it.product.thumbnail?.url || it.product.small_image?.url || it.product.media_gallery?.[0]?.url ? (
                                <img
                                    src={it.product.thumbnail?.url || it.product.small_image?.url || it.product.media_gallery?.[0]?.url}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ color: '#ccc', fontSize: '10px' }}>No IMG</div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{it.product.name}</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>Qty: {it.quantity}</div>
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '14px', textAlign: 'right' }}>
                            {(() => {
                                const regularPrice = it.product.price_range.minimum_price.regular_price.value;
                                const finalPriceNode = it.product.price_range.minimum_price.final_price;
                                const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
                                const isDiscounted = currentPrice < regularPrice;

                                return (
                                    <>
                                        {isDiscounted && (
                                            <div style={{ fontSize: '12px', color: '#888', textDecoration: 'line-through', fontWeight: 'normal' }}>
                                                ${(regularPrice * it.quantity).toFixed(2)}
                                            </div>
                                        )}
                                        <div style={{ color: isDiscounted ? '#d32f2f' : 'inherit' }}>
                                            ${(currentPrice * it.quantity).toFixed(2)}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ spaceY: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginTop: '10px' }}>
                    <span>Shipping</span>
                    <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Calculated next'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #eee', fontWeight: '800', fontSize: '1.2rem', color: '#000' }}>
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ marginTop: '25px', background: '#f0fff4', padding: '15px', borderRadius: '8px', fontSize: '12px', color: '#00a651', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <ShieldCheck size={20} />
                <span>Secure SSL encrypted checkout. Your data is safe with us.</span>
            </div>
        </div>
    );

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '60px 0' }}>
            <div className="container">
                {step < 5 && (
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a1a1a', marginBottom: '10px' }}>Checkout</h1>
                        <p style={{ color: '#666' }}>Please complete the following steps to finalize your order.</p>
                    </div>
                )}

                {step < 5 && <StepIndicator />}

                {step < 5 ? (
                    <div className="checkout-grid">
                        <div className="checkout-main">

                            {/* STEP 1: ACCOUNT */}
                            {step === 1 && (
                                <div className="checkout-card animate-in">
                                    <h3><User size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Account Details</h3>
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', background: '#f5f5f5', padding: '5px', borderRadius: '30px', width: 'fit-content' }}>
                                        <button
                                            onClick={() => setMode('guest')}
                                            style={{
                                                padding: '10px 25px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: mode === 'guest' ? '#fff' : 'transparent',
                                                boxShadow: mode === 'guest' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
                                                fontWeight: '600'
                                            }}
                                        >Guest Checkout</button>
                                        <button
                                            onClick={() => setMode('login')}
                                            style={{
                                                padding: '10px 25px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: mode === 'login' ? '#fff' : 'transparent',
                                                boxShadow: mode === 'login' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
                                                fontWeight: '600'
                                            }}
                                        >Login</button>
                                    </div>

                                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label>First Name</label>
                                            <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" />
                                        </div>
                                        <div>
                                            <label>Last Name</label>
                                            <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Doe" />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label>Email Address</label>
                                            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label>Phone Number</label>
                                            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setStep(2)} className="button primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 40px' }}>
                                            Continue to Shipping <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: SHIPPING */}
                            {step === 2 && (
                                <div className="checkout-card animate-in">
                                    <h3><MapPin size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Shipping Address</h3>
                                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label>Street Address</label>
                                            <input value={form.street} onChange={e => update('street', e.target.value)} placeholder="123 Audio Lane" />
                                        </div>
                                        <div>
                                            <label>City</label>
                                            <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="New York" />
                                        </div>
                                        <div>
                                            <label>State / Region</label>
                                            <input value={form.region} onChange={e => update('region', e.target.value)} placeholder="NY" />
                                        </div>
                                        <div>
                                            <label>Postcode / ZIP</label>
                                            <input value={form.postcode} onChange={e => update('postcode', e.target.value)} placeholder="10001" />
                                        </div>
                                        <div>
                                            <label>Country</label>
                                            <select value={form.country} onChange={e => update('country', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                                <option value="US">United States</option>
                                                <option value="CA">Canada</option>
                                                <option value="GB">United Kingdom</option>
                                            </select>
                                        </div>
                                    </div>

                                    <h3 style={{ marginTop: '40px' }}><Truck size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Shipping Method</h3>
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        <label style={{ display: 'flex', border: '2px solid #eee', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', borderColor: form.shippingMethod === 'standard' ? 'var(--primary-color)' : '#eee' }}>
                                            <input type="radio" name="shipping" value="standard" checked={form.shippingMethod === 'standard'} onChange={e => update('shippingMethod', e.target.value)} style={{ display: 'none' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700' }}>Standard Shipping</div>
                                                <div style={{ fontSize: '13px', color: '#666' }}>3-5 Business Days</div>
                                            </div>
                                            <div style={{ fontWeight: '800' }}>$5.00</div>
                                        </label>
                                        <label style={{ display: 'flex', border: '2px solid #eee', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', borderColor: form.shippingMethod === 'express' ? 'var(--primary-color)' : '#eee' }}>
                                            <input type="radio" name="shipping" value="express" checked={form.shippingMethod === 'express'} onChange={e => update('shippingMethod', e.target.value)} style={{ display: 'none' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700' }}>Express Shipping</div>
                                                <div style={{ fontSize: '13px', color: '#666' }}>Next Day Delivery</div>
                                            </div>
                                            <div style={{ fontWeight: '800' }}>$15.00</div>
                                        </label>
                                    </div>

                                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <ChevronLeft size={18} /> Back
                                        </button>
                                        <button onClick={() => setStep(3)} className="button primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 40px' }}>
                                            Continue to Payment <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PAYMENT */}
                            {step === 3 && (
                                <div className="checkout-card animate-in">
                                    <h3><CreditCard size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Payment Method</h3>
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', border: '2px solid #eee', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', borderColor: form.paymentMethod === 'card' ? 'var(--primary-color)' : '#eee' }}>
                                            <input type="radio" name="payment" value="card" checked={form.paymentMethod === 'card'} onChange={e => update('paymentMethod', e.target.value)} style={{ display: 'none' }} />
                                            <div style={{ marginRight: '20px', fontSize: '24px' }}>💳</div>
                                            <div style={{ flex: 1, fontWeight: '700' }}>Credit / Debit Card</div>
                                        </label>

                                        {form.paymentMethod === 'card' && (
                                            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                                                <label>Card Number</label>
                                                <input placeholder="0000 0000 0000 0000" style={{ letterSpacing: '2px' }} />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                                    <div>
                                                        <label>Expiry Date</label>
                                                        <input placeholder="MM / YY" />
                                                    </div>
                                                    <div>
                                                        <label>CVV</label>
                                                        <input type="password" placeholder="***" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <label style={{ display: 'flex', alignItems: 'center', border: '2px solid #eee', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', borderColor: form.paymentMethod === 'paypal' ? 'var(--primary-color)' : '#eee' }}>
                                            <input type="radio" name="payment" value="paypal" checked={form.paymentMethod === 'paypal'} onChange={e => update('paymentMethod', e.target.value)} style={{ display: 'none' }} />
                                            <div style={{ marginRight: '20px', fontSize: '24px' }}>🅿️</div>
                                            <div style={{ flex: 1, fontWeight: '700' }}>PayPal</div>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', border: '2px solid #eee', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', borderColor: form.paymentMethod === 'checkmo' ? 'var(--primary-color)' : '#eee' }}>
                                            <input type="radio" name="payment" value="checkmo" checked={form.paymentMethod === 'checkmo'} onChange={e => update('paymentMethod', e.target.value)} style={{ display: 'none' }} />
                                            <div style={{ marginRight: '20px', fontSize: '24px' }}>🏦</div>
                                            <div style={{ flex: 1, fontWeight: '700' }}>Check / Money Order</div>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', border: '2px solid #eee', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', borderColor: form.paymentMethod === 'cashondelivery' ? 'var(--primary-color)' : '#eee' }}>
                                            <input type="radio" name="payment" value="cashondelivery" checked={form.paymentMethod === 'cashondelivery'} onChange={e => update('paymentMethod', e.target.value)} style={{ display: 'none' }} />
                                            <div style={{ marginRight: '20px', fontSize: '24px' }}>💵</div>
                                            <div style={{ flex: 1, fontWeight: '700' }}>Cash on Delivery</div>
                                        </label>
                                    </div>

                                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                                        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <ChevronLeft size={18} /> Back
                                        </button>
                                        <button onClick={() => setStep(4)} className="button primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 40px' }}>
                                            Review Order <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: REVIEW */}
                            {step === 4 && (
                                <div className="checkout-card animate-in">
                                    <h3><ShieldCheck size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Final Review</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px' }}>Shipping To</h4>
                                            <div style={{ fontWeight: '600', marginTop: '5px' }}>{form.firstName} {form.lastName}</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>{form.street}</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>{form.city}, {form.postcode}</div>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px' }}>Method</h4>
                                            <div style={{ fontWeight: '600', marginTop: '5px' }}>{form.shippingMethod.toUpperCase()} Delivery</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>Payment via {form.paymentMethod.toUpperCase()}</div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <CheckCircle style={{ color: '#00a651' }} />
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1a1a1a' }}>Almost there!</div>
                                                <div style={{ fontSize: '14px', color: '#2b6e44' }}>Click the button below to complete your premium gear order.</div>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                                        <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <ChevronLeft size={18} /> Back
                                        </button>
                                        <button
                                            onClick={placeOrder}
                                            disabled={placing}
                                            className="button primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 60px', fontSize: '1.1rem' }}
                                        >
                                            {placing ? 'Processing...' : 'Place Order Now'} <CheckCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* SIDEBAR SUMMARY */}
                        <OrderSummary />
                    </div>
                ) : (
                    /* STEP 5: SUCCESS */
                    <div style={{ textAlign: 'center', padding: '80px 0' }} className="animate-in">
                        <div style={{ width: '100px', height: '100px', background: '#00a651', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', boxShadow: '0 10px 30px rgba(0, 166, 81, 0.4)' }}>
                            <CheckCircle size={60} />
                        </div>
                        <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '15px' }}>Success!</h2>
                        <p style={{ fontSize: '1.2rem', color: '#666' }}>Your order <strong>#{orderNumber}</strong> has been placed successfully.</p>
                        <p style={{ color: '#888', marginBottom: '40px' }}>We've sent a confirmation email to <strong>{form.email}</strong></p>
                        <button onClick={() => navigate('/')} className="button primary" style={{ padding: '15px 50px' }}>
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Checkout;
