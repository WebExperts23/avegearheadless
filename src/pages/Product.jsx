import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_DETAIL } from '../api/products';
import { useCart } from '../contexts/CartContext';
import { getSalableQty } from '../api/stock';
import Brands from '../components/home/Brands';
import {
    Truck, ShieldCheck, RefreshCw,
    Heart, BarChart2, Mail,
    Facebook, Twitter, Instagram,
    Bluetooth, Speaker, Gamepad2, Headphones,
    Minus, Plus
} from 'lucide-react';

const Product = () => {
    const { sku } = useParams();
    const { addToCart, cartItems, loading: cartLoading } = useCart();

    // 1. All Hooks MUST be at the top level, before any returns
    const { loading, error, data } = useQuery(GET_PRODUCT_DETAIL, {
        variables: { sku }
    });

    const [quantity, setQuantity] = useState(1);
    const [maxQty, setMaxQty] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});

    // 2. Data Processing
    const product = data?.products?.items?.[0];

    // Identify active variant based on selected options
    const getActiveSku = () => {
        if (!product) return null;
        if (!product.variants || Object.keys(selectedOptions).length === 0) return product.sku;

        const variant = product.variants.find(v =>
            v.attributes.every(attr => selectedOptions[attr.code] === attr.value_index)
        );

        return variant ? variant.product.sku : product.sku;
    };

    const activeSku = getActiveSku();

    // Load salable quantity from Magento inventory
    useEffect(() => {
        let cancelled = false;

        const loadStock = async () => {
            if (!activeSku) {
                setMaxQty(null);
                return;
            }

            // If we have selected options but didn't find a matching variant, 
            // we should probably mark as unavailable or keep parent stock.
            // Magento usually returns the parent stock status if no variant matches.

            try {
                let qty = await getSalableQty(activeSku);
                console.log(`[StockDebug] ${activeSku} - qty from getSalableQty:`, qty);

                if (!cancelled) {
                    if (qty === null || qty === undefined) {
                        // Fallback to GraphQL data if REST fails
                        // If it's a variant, we might need to find it in the products query result
                        qty = product.only_x_left_in_stock;
                        console.log(`[StockDebug] ${activeSku} - fallback GraphQL:`, qty);
                    }

                    setMaxQty(typeof qty === 'number' ? qty : null);

                    if (typeof qty === 'number') {
                        setQuantity(prev => {
                            if (qty === 0) return 1;
                            const newQty = prev > qty ? qty : prev;
                            return newQty;
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load stock for', activeSku, err);
            }
        };

        loadStock();

        return () => {
            cancelled = true;
        };
    }, [activeSku, product?.only_x_left_in_stock]);

    // 3. Loading / Error States
    if (loading) return (
        <div style={{ backgroundColor: '#fff' }}>
            <div className="container" style={{ padding: '20px 0' }}>
                <div className="skeleton" style={{ width: '150px', height: '1rem' }}></div>
            </div>
            <div className="container" style={{ paddingBottom: '80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px' }}>
                    <div className="gallery-skeleton">
                        <div className="skeleton skeleton-img"></div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '8px' }}></div>)}
                        </div>
                    </div>
                    <div className="info-skeleton">
                        <div className="skeleton skeleton-title"></div>
                        <div className="skeleton" style={{ width: '60%', height: '1rem', marginBottom: '20px' }}></div>
                        <div className="skeleton skeleton-price"></div>
                        <div className="skeleton-text skeleton" style={{ width: '90%' }}></div>
                        <div className="skeleton-text skeleton" style={{ width: '85%' }}></div>
                        <div className="skeleton-text skeleton" style={{ width: '95%' }}></div>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                            <div className="skeleton" style={{ width: '100px', height: '50px', borderRadius: '30px' }}></div>
                            <div className="skeleton skeleton-btn"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'red' }}>Error: {error.message}</div>;
    if (!product) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Product not found.</div>;

    // Use activeSku (selected variant) for checking existing qty in cart
    const cartItem = cartItems?.find(item => item.product.sku === activeSku);
    const inCartQty = cartItem ? cartItem.quantity : 0;

    const images = (product.media_gallery && product.media_gallery.length > 0)
        ? product.media_gallery
        : [{ url: 'https://placehold.co/600x600?text=No+Image', label: 'No Image' }];

    const regularPrice = product.price_range.minimum_price.regular_price;
    const finalPrice = product.price_range.minimum_price.final_price;
    const hasDiscount = finalPrice && finalPrice.value < regularPrice.value;

    // Determine the image to display: User selected OR First available
    const mainImage = selectedImage || images[0].url;

    const handleQtyChange = (val) => {
        const newQty = quantity + val;
        // Detailed logging to trace why quantity enforcement might fail
        console.log(`[ProductDebug] ${activeSku} - handleQtyChange: cur=${quantity}, delta=${val}, new=${newQty}, inCart=${inCartQty}, max=${maxQty}`);

        if (newQty < 1) return;
        if (maxQty !== null && (newQty + inCartQty) > maxQty) {
            console.warn(`[StockDebug] ${product.sku} - BLOQUED: limit ${maxQty} exceeded`);
            return;
        }
        setQuantity(newQty);
    };

    const isAtLimit = maxQty !== null && inCartQty >= maxQty;
    const outOfStock = maxQty === 0;

    const stripHtml = (html) => {
        if (!html) return '';
        // In browser: first decode any escaped entities (e.g. &lt;h2&gt;),
        // then parse the decoded HTML to remove tags.
        if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
            const decodeDiv = document.createElement('div');
            decodeDiv.innerHTML = html;
            const decoded = decodeDiv.textContent || decodeDiv.innerText || '';

            const parser = new DOMParser();
            const doc = parser.parseFromString(decoded, 'text/html');
            const text = doc.body.textContent || doc.body.innerText || '';
            return text.replace(/\s+\n/g, '\n').trim();
        }

        // Fallback: decode simple entities and strip tags using regex
        const decodedFallback = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        return decodedFallback.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    };

    // Debug: log raw HTML and stripped output to browser console
    if (typeof window !== 'undefined') {
        console.log('DEBUG product.description.html:', product?.description?.html);
        console.log('DEBUG stripped description:', stripHtml(product?.description?.html));
        console.log('DEBUG package_contents.html:', product?.package_contents?.html);
    }

    return (
        <div style={{ backgroundColor: '#fff' }}>
            {/* Breadcrumbs */}
            <div className="container" style={{ padding: '20px 0', fontSize: '0.85rem', color: '#888' }}>
                <Link to="/">Home</Link> &gt; <span>{product.name}</span>
            </div>

            <div className="container" style={{ paddingBottom: '80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '60px', marginBottom: '80px' }}>

                    {/* Left: Gallery */}
                    <div className="gallery-section">
                        <div style={{
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <img src={mainImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto' }}>
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(img.url)}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        border: `1px solid ${mainImage === img.url ? 'var(--primary-color)' : '#eee'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        opacity: mainImage === img.url ? 1 : 0.7
                                    }}
                                >
                                    <img src={img.url} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="info-section">
                        <h1 style={{ fontSize: '2rem', fontWeight: '400', color: '#333', marginBottom: '10px' }}>
                            {product.name}
                        </h1>

                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '20px' }}>
                            <span style={{ cursor: 'pointer' }}>Be the first to review this product</span>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#d32f2f', marginBottom: '5px' }}>
                            Sign up for price alert
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginBottom: '10px' }}>
                            {hasDiscount ? (
                                <>
                                    <span style={{ fontSize: '1.5rem', color: '#888', textDecoration: 'line-through' }}>
                                        {regularPrice.currency} {regularPrice.value.toFixed(2)}
                                    </span>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '700', color: '#d32f2f' }}>
                                        {finalPrice.currency} {finalPrice.value.toFixed(2)}
                                    </span>
                                </>
                            ) : (
                                <span style={{ fontSize: '2.5rem', fontWeight: '700', color: '#333' }}>
                                    {regularPrice.currency} {regularPrice.value.toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#666' }}>
                            Condition: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>New</span>
                        </div>
                        {outOfStock ? (
                            <div style={{ fontSize: '0.85rem', marginBottom: '12px', color: '#d32f2f' }}>
                                Out of Stock
                            </div>
                        ) : (
                            maxQty !== null && (
                                <div style={{ fontSize: '0.85rem', marginBottom: '12px', color: '#666' }}>
                                    Available: {maxQty} item{maxQty === 1 ? '' : 's'}{maxQty <= 5 ? ' left' : ''}
                                </div>
                            )
                        )}

                        {/* Configurable Options */}
                        {product.configurable_options && product.configurable_options.map(option => (
                            <div key={option.id} style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '0.9rem' }}>{option.label}</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {option.values.map(val => (
                                        <button
                                            key={val.uid}
                                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.attribute_code]: val.value_index }))}
                                            style={{
                                                padding: '8px 15px',
                                                borderRadius: '4px',
                                                border: `1px solid ${selectedOptions[option.attribute_code] === val.value_index ? 'var(--primary-color)' : '#ddd'}`,
                                                background: selectedOptions[option.attribute_code] === val.value_index ? '#fff8f4' : '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div style={{ lineHeight: '1.6', color: '#666', marginBottom: '20px', fontSize: '0.95rem' }}>
                            <div>{stripHtml(product.description.html ? product.description.html.substring(0, 250) + '...' : '')}</div>
                            <a href="#details" style={{ color: 'var(--primary-color)', fontSize: '0.85rem' }}>Read more ▼</a>
                        </div>

                        {/* Add to Cart Area */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
                            {/* Qty */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#f5f5f5',
                                borderRadius: '30px',
                                padding: '5px 10px',
                                opacity: cartLoading ? 0.6 : 1,
                                pointerEvents: cartLoading ? 'none' : 'auto'
                            }}>
                                <button
                                    onClick={() => handleQtyChange(-1)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '10px' }}
                                    disabled={cartLoading}
                                ><Minus size={16} /></button>
                                <span style={{ padding: '0 15px', fontWeight: 'bold' }}>{quantity}</span>
                                <button
                                    onClick={() => handleQtyChange(1)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '10px' }}
                                    disabled={cartLoading}
                                ><Plus size={16} /></button>
                            </div>

                            {/* Button */}
                            <button
                                onClick={() => addToCart(product, quantity, selectedOptions)}
                                className="primary"
                                style={{ padding: '15px 40px', fontSize: '1rem' }}
                                disabled={outOfStock || isAtLimit || (maxQty != null && (quantity + inCartQty) > maxQty) || cartLoading}
                            >
                                {cartLoading ? 'Processing...' : (outOfStock ? 'Out of Stock' : (isAtLimit ? 'Max in Cart' : 'Add to Cart'))}
                            </button>

                            {/* Utility Icons */}
                            <div style={{ display: 'flex', gap: '15px', color: '#888' }}>
                                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '50%', cursor: 'pointer' }}><Heart size={20} /></div>
                                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '50%', cursor: 'pointer' }}><BarChart2 size={20} /></div>
                                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '50%', cursor: 'pointer' }}><Mail size={20} /></div>
                            </div>
                        </div>

                        {/* Social + Trust */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <button style={{ background: '#3b5998', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Facebook size={12} /> Share</button>
                            <button style={{ background: '#00acee', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Twitter size={12} /> Tweet</button>
                            <button style={{ background: '#dd4b39', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Instagram size={12} /> Pin</button>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            background: '#f9f9f9',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #eee'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <Truck size={24} color="var(--primary-color)" />
                                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>Fast Shipping</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <ShieldCheck size={24} color="var(--primary-color)" />
                                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>Secure Checkout</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <RefreshCw size={24} color="var(--primary-color)" />
                                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>30-Day Returns</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Tabs Section */}
                <div id="details" style={{ border: '1px solid #eee', borderRadius: '12px', padding: '0', marginBottom: '60px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#f5f5f5', borderBottom: '1px solid #eee' }}>
                        {['Details', 'Package Contents', 'Reviews'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                style={{
                                    padding: '15px 30px',
                                    background: activeTab === tab.toLowerCase() ? 'white' : 'transparent',
                                    border: 'none',
                                    borderRight: '1px solid #eee',
                                    borderTop: activeTab === tab.toLowerCase() ? '2px solid var(--primary-color)' : '2px solid transparent',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    color: activeTab === tab.toLowerCase() ? '#333' : '#666'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: '40px' }}>
                        {activeTab === 'details' && (
                            <div>
                                <h3 style={{ marginTop: 0 }}>Features</h3>
                                <div>{stripHtml(product.description.html)}</div>
                            </div>
                        )}
                        {activeTab === 'package contents' && (
                            product.package_contents && product.package_contents.html
                                ? <div>{stripHtml(product.package_contents.html)}</div>
                                : <div>Package contents not available.</div>
                        )}
                        {activeTab === 'reviews' && <div>No reviews yet.</div>}
                    </div>
                </div>

                {/* Key Features Icons */}
                <div style={{ marginBottom: '80px' }}>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '300', marginBottom: '40px', color: '#666' }}>Key Features</h3>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
                        {[
                            { icon: Bluetooth, label: 'Bluetooth 5.0', desc: 'Immersive clarity on the go' },
                            { icon: Speaker, label: 'Home Audio', desc: 'Upgrade your living space' },
                            { icon: Gamepad2, label: 'Gaming Products', desc: 'Set the stage for perfect gaming' },
                            { icon: Headphones, label: 'Car & Marine Audio', desc: 'Ensure your music feels dynamic' },
                        ].map((item, idx) => (
                            <div key={idx} style={{
                                flex: 1,
                                background: 'white',
                                padding: '30px',
                                borderRadius: '12px',
                                boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
                                textAlign: 'center',
                                border: '1px solid #f0f0f0'
                            }}>
                                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '50%', display: 'inline-block', marginBottom: '15px' }}>
                                    <item.icon size={24} color="#333" />
                                </div>
                                <h4 style={{ margin: '0 0 5px', color: '#d35400' }}>{item.label}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Brands */}
                <Brands />
            </div>
        </div>
    );
};

export default Product;
