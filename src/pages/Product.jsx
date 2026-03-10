import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_DETAIL, GET_CMS_BLOCKS } from '../api/products';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { getSalableQty } from '../api/stock';
import Brands from '../components/home/Brands';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import ProductReviews from '../components/catalog/ProductReviews';

import SEO from '../components/common/SEO';
import {
    Truck, ShieldCheck, RefreshCw,
    Heart, BarChart2, Mail,
    Facebook, Twitter, Instagram,
    Bluetooth, Volume2, Monitor, Headphones,
    Minus, Plus, FileText, Package, Star, Check,
    ChevronDown, ChevronUp
} from 'lucide-react';

const Product = () => {
    const { sku } = useParams();
    const { addToCart, cartItems, loading: cartLoading } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItemId, loading: wishlistLoading } = useWishlist();
    const { setBreadcrumbs } = useBreadcrumbs();

    // 1. All Hooks MUST be at the top level, before any returns
    const { loading, error, data } = useQuery(GET_PRODUCT_DETAIL, {
        variables: { sku }
    });

    const { data: cmsData } = useQuery(GET_CMS_BLOCKS, {
        variables: { identifiers: ['key-features-block'] }
    });

    const keyFeaturesBlock = cmsData?.cmsBlocks?.items?.[0];

    const product = data?.products?.items?.[0];

    // Update breadcrumbs when product data is loaded
    useEffect(() => {
        if (product) {
            const crumbs = [];

            // Add category if available
            if (product.categories && product.categories.length > 0) {
                // Find the deepest or first non-root category
                // For now, take the first one available
                const category = product.categories[0];

                // Add parent categories from breadcrumbs
                if (category.breadcrumbs) {
                    category.breadcrumbs.forEach(b => {
                        crumbs.push({ label: b.category_name, path: `/category/${b.category_uid}` });
                    });
                }

                crumbs.push({ label: category.name, path: `/${category.url_key}.html` });
            }

            crumbs.push({ label: product.name, path: `/product/${sku}` });

            setBreadcrumbs(crumbs);
        }
        return () => setBreadcrumbs([]);
    }, [product, sku, setBreadcrumbs]);

    const [quantity, setQuantity] = useState(1);
    const [maxQty, setMaxQty] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});

    // 2. Data Processing

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
    const inWishlist = isInWishlist(activeSku);
    const wishlistItemId = getWishlistItemId(activeSku);
    const isProcessing = cartLoading || wishlistLoading;

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        if (inWishlist) {
            await removeFromWishlist(wishlistItemId);
        } else {
            await addToWishlist(activeSku);
        }
    };

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
                <div className="pdp-main-layout">
                    <div className="pdp-gallery-section gallery-skeleton">
                        <div className="skeleton skeleton-img"></div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '8px' }}></div>)}
                        </div>
                    </div>
                    <div className="pdp-info-section info-skeleton">
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

    const getUniqueImages = (gallery) => {
        if (!gallery || gallery.length === 0) return [{ url: 'https://placehold.co/600x600?text=No+Image', label: 'No Image' }];
        const seen = new Set();
        return gallery.filter(img => {
            if (seen.has(img.url)) return false;
            seen.add(img.url);
            return true;
        });
    };

    const images = getUniqueImages(product.media_gallery);

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

    const decodeHtml = (html) => {
        if (!html) return '';
        if (typeof window !== 'undefined') {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            const decoded = txt.value;
            // If it was double encoded, try one more time
            if (decoded.includes('&amp;') || decoded.includes('&lt;')) {
                txt.innerHTML = decoded;
                return txt.value;
            }
            return decoded;
        }
        return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const decoded = decodeHtml(html);
        return decoded.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    };

    // Debug: log raw HTML and stripped output to browser console
    if (typeof window !== 'undefined') {
        console.log('DEBUG product.description.html:', product?.description?.html);
        console.log('DEBUG stripped description:', stripHtml(product?.description?.html));
        console.log('DEBUG package_contents.html:', product?.package_contents?.html);
    }

    // Structured Data for Product
    const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        'name': product.name,
        'image': images.map(img => img.url),
        'description': stripHtml(product.description?.html),
        'sku': product.sku,
        'offers': {
            '@type': 'Offer',
            'url': window.location.href,
            'priceCurrency': finalPrice.currency,
            'price': finalPrice.value,
            'availability': outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
        }
    };

    // Render stars from a 0-100 rating
    const renderSummaryStars = (ratingValue) => {
        const normalizedRating = (ratingValue || 0) / 20; // 0-100 to 0-5
        
        return (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                        key={star} 
                        size={16} 
                        fill={star <= normalizedRating ? '#f39c12' : 'none'} 
                        color={star <= normalizedRating ? '#f39c12' : '#ccc'} 
                    />
                ))}
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: '#fff' }}>
            <SEO
                title={product.meta_title || product.name}
                description={product.meta_description || stripHtml(product.description?.html).substring(0, 160)}
                ogType="product"
                ogImage={mainImage}
                structuredData={structuredData}
            />
            <div className="container" style={{ paddingBottom: '80px' }}>
                <div className="pdp-main-layout" style={{ marginBottom: '80px' }}>

                    {/* Left: Gallery */}
                    <div className="pdp-gallery-section gallery-section">
                        <div className="pdp-main-image-container" style={{
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
                                    <img src={img.url} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="pdp-info-section info-section">
                        <h1 className="pdp-title" style={{ fontWeight: '400', color: '#333', marginBottom: '10px' }}>
                            {product.name}
                        </h1>

                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '20px', alignItems: 'center' }}>
                            {product.review_count > 0 ? (
                                <>
                                    {renderSummaryStars(product.rating_summary)}
                                    <span 
                                        style={{ cursor: 'pointer', color: '#666', textDecoration: 'underline' }}
                                        onClick={() => {
                                            setActiveTab('reviews');
                                            document.getElementById('details').scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        {product.review_count} {product.review_count === 1 ? 'Review' : 'Reviews'}
                                    </span>
                                </>
                            ) : (
                                <span 
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => {
                                        setActiveTab('reviews');
                                        document.getElementById('details').scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    Be the first to review this product
                                </span>
                            )}
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
                        <div className="pdp-action-row" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
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
                                <div
                                    onClick={handleWishlistToggle}
                                    style={{
                                        padding: '10px',
                                        border: `1px solid ${inWishlist ? '#ff4d4d' : '#eee'}`,
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        color: inWishlist ? '#ff4d4d' : '#888',
                                        background: inWishlist ? '#fff0f0' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    <Heart size={20} fill={inWishlist ? "#ff4d4d" : "none"} strokeWidth={inWishlist ? 0 : 2} />
                                </div>
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

                {/* Tabs Section (Desktop) */}
                <div id="details" className="pdp-tabs-container pdp-tabs-container-desktop" style={{ marginBottom: '60px' }}>
                    <div className="pdp-tabs-row" style={{ display: 'flex', gap: '5px', marginBottom: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {[
                            { name: 'Details', icon: FileText },
                            { name: 'Package Contents', icon: Package },
                            { name: 'Reviews', icon: Star }
                        ].map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name.toLowerCase())}
                                className={`pdp-tab-btn ${activeTab === tab.name.toLowerCase() ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 25px',
                                    border: '1px solid #e0e0e0',
                                    borderBottom: activeTab === tab.name.toLowerCase() ? '1px solid #fff' : '1px solid #e0e0e0',
                                    background: activeTab === tab.name.toLowerCase() ? '#fff' : '#f8f8f8',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: activeTab === tab.name.toLowerCase() ? 'var(--primary-color)' : '#666',
                                    borderRadius: '6px 6px 0 0',
                                    position: 'relative',
                                    zIndex: activeTab === tab.name.toLowerCase() ? 2 : 1,
                                    marginBottom: '-1px'
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                    <div className="pdp-tab-content" style={{ 
                        padding: '40px', 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '0 6px 6px 6px',
                        background: '#fff'
                    }}>
                        {activeTab === 'details' && (
                            <div className="pdp-details-wrapper">
                                <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '16px', color: '#333', marginBottom: '20px' }}>Features</h3>
                                <div className="pdp-details-content" dangerouslySetInnerHTML={{ __html: decodeHtml(product.description.html) }} />
                            </div>
                        )}
                        {activeTab === 'package contents' && (
                            product.package_contents && product.package_contents.html
                                ? <div dangerouslySetInnerHTML={{ __html: decodeHtml(product.package_contents.html) }} />
                                : <div>Package contents not available.</div>
                        )}
                        {activeTab === 'reviews' && (
                            <ProductReviews sku={product.sku} />
                        )}
                    </div>
                </div>

                {/* Accordion Section (Mobile) */}
                <div className="pdp-accordion-container pdp-accordion-container-mobile" style={{ marginBottom: '60px' }}>
                    {[
                        { 
                            name: 'Details', 
                            icon: FileText, 
                            content: () => (
                                <div className="pdp-details-wrapper">
                                    <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '16px', color: '#333', marginBottom: '20px' }}>Features</h3>
                                    <div className="pdp-details-content overflow-protected" dangerouslySetInnerHTML={{ __html: decodeHtml(product.description.html) }} />
                                </div>
                            ) 
                        },
                        { 
                            name: 'Package Contents', 
                            icon: Package, 
                            content: () => (
                                product.package_contents && product.package_contents.html
                                    ? <div className="overflow-protected" dangerouslySetInnerHTML={{ __html: decodeHtml(product.package_contents.html) }} />
                                    : <div>Package contents not available.</div>
                            ) 
                        },
                        { 
                            name: 'Reviews', 
                            icon: Star, 
                            content: () => <ProductReviews sku={product.sku} /> 
                        }
                    ].map(section => {
                        const isOpen = activeTab === section.name.toLowerCase();
                        return (
                            <div key={section.name} className="pdp-accordion-item" style={{ borderBottom: '1px solid #eee' }}>
                                <button
                                    onClick={() => setActiveTab(isOpen ? '' : section.name.toLowerCase())}
                                    className="pdp-accordion-header"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '20px',
                                        background: isOpen ? '#fcfcfc' : '#fff',
                                        border: 'none',
                                        borderTop: '1px solid #eee',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: isOpen ? '700' : '600',
                                        color: isOpen ? 'var(--primary-color)' : '#333',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <section.icon size={18} />
                                        {section.name}
                                    </div>
                                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isOpen && (
                                    <div className="pdp-accordion-content" style={{ padding: '0 20px 20px 20px', background: '#fcfcfc' }}>
                                        {section.content()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Key Features Section */}
                <div className="key-features-section" style={{ marginBottom: '80px' }}>
                    <h3>Key Features</h3>
                    {keyFeaturesBlock ? (
                        <div className="magento-cms-renderer" dangerouslySetInnerHTML={{ __html: decodeHtml(keyFeaturesBlock.content) }} />
                    ) : (
                        <div className="key-features-grid">
                            {[
                                { icon: Bluetooth, label: 'Bluetooth 5.0', desc: 'Immersive clarity on the go.' },
                                { icon: Volume2, label: 'Home Audio', desc: 'Upgrade your living space.' },
                                { icon: Monitor, label: 'Gaming Products', desc: 'Set the stage for the perfect gaming environment.' },
                                { icon: Headphones, label: 'Car & Marine Audio', desc: 'Ensure your music feels dynamic.' },
                            ].map((item, idx) => (
                                <div key={idx} className="key-feature-card">
                                    <div className="feature-icon-circle">
                                        <item.icon size={30} color="#000" strokeWidth={1.5} />
                                    </div>
                                    <h4>{item.label}</h4>
                                    <p>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Brands */}
                <Brands />
            </div>
        </div>
    );
};

export default Product;
