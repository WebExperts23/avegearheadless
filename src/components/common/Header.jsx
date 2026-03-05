import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_CATEGORY_TREE, GET_STORE_CONFIG, GET_PRODUCTS } from '../../api/products';
import { useCart } from '../../contexts/CartContext';
import { Menu, ChevronDown } from 'lucide-react';

const Header = () => {
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Lazy query for suggestions
    const [fetchSuggestions, { data: searchData, loading: searchLoading }] = useLazyQuery(GET_PRODUCTS);

    const { loading: catLoading, data: catData } = useQuery(GET_CATEGORY_TREE);
    const { data: configData } = useQuery(GET_STORE_CONFIG);

    const containerRef = useRef(null);

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 3) {
                fetchSuggestions({ variables: { search: searchTerm, pageSize: 5 } });
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchSuggestions]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const categories = catData?.categoryList?.[0]?.children || [];
    const visibleCategories = categories.filter(cat => cat.include_in_menu === 1);

    const logoSrc = configData?.storeConfig?.header_logo_src;
    const mediaBase = configData?.storeConfig?.secure_base_media_url;
    const logoAlt = configData?.storeConfig?.logo_alt || 'AV Gear';

    const fullLogoUrl = logoSrc && mediaBase ?
        (logoSrc.startsWith('http') ? logoSrc : `${mediaBase}logo/${logoSrc}`)
        : null;

    const suggestions = searchData?.products?.items || [];

    return (
        <header>
            {/* Top Bar */}
            <div className="top-bar bg-dark" style={{ padding: '8px 0', fontSize: '12px', borderBottom: '1px solid #333' }}>
                <div className="container flex justify-between">
                    <div className="flex gap-4">
                        <span>Free Shipping &gt; $200</span>
                        <span>Price Match Guarantee</span>
                    </div>
                    <div className="flex gap-4">
                        <Link to="#">Find a Store</Link>
                        <Link to="#">Contact Us</Link>
                        <Link to="#">My Account</Link>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="main-header" style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                <div className="container flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="logo" style={{ minWidth: '150px' }}>
                        {fullLogoUrl ? (
                            <img src={fullLogoUrl} alt={logoAlt} style={{ maxHeight: '50px' }} />
                        ) : (
                            <span style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>AV<span style={{ color: 'var(--primary-color)' }}>GEAR</span></span>
                        )}
                    </Link>

                    {/* Search Bar */}
                    <div className="search-bar" style={{ flex: 1, margin: '0 40px', maxWidth: '600px', position: 'relative' }} ref={containerRef}>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (searchTerm.trim()) {
                                navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                                setShowSuggestions(false);
                            }
                        }}
                            style={{ position: 'relative' }}
                        >
                            <input
                                type="text"
                                placeholder="Search entire store here..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => searchTerm.length >= 3 && setShowSuggestions(true)}
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    borderRadius: '30px',
                                    border: '1px solid #ddd',
                                    outline: 'none',
                                    background: '#f9f9f9'
                                }}
                            />
                            <button type="submit" style={{
                                position: 'absolute',
                                right: '5px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#666',
                                cursor: 'pointer'
                            }}>
                                🔍
                            </button>
                        </form>

                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                marginTop: '5px',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}>
                                {searchLoading ? (
                                    <div style={{ padding: '15px', color: '#888', textAlign: 'center' }}>Loading...</div>
                                ) : suggestions.length > 0 ? (
                                    <>
                                        {suggestions.map((prod) => (
                                            <Link
                                                key={prod.uid}
                                                to={`/product/${prod.sku}`}
                                                onClick={() => setShowSuggestions(false)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 15px',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    textDecoration: 'none',
                                                    color: '#333',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                <div style={{ width: '40px', height: '40px', background: '#f5f5f5', flexShrink: 0 }}>
                                                    {prod.small_image?.url && <img src={prod.small_image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                                </div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                                                    {(() => {
                                                        const regularPrice = prod.price_range.minimum_price.regular_price.value;
                                                        const finalPriceNode = prod.price_range.minimum_price.final_price;
                                                        const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
                                                        const isDiscounted = currentPrice < regularPrice;
                                                        return (
                                                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '3px' }}>
                                                                {isDiscounted && (
                                                                    <span style={{ color: '#888', textDecoration: 'line-through', marginRight: '6px', fontWeight: 'normal' }}>
                                                                        {prod.price_range.minimum_price.regular_price.currency} {regularPrice.toFixed(2)}
                                                                    </span>
                                                                )}
                                                                <span style={{ color: isDiscounted ? '#d32f2f' : 'var(--primary-color)' }}>
                                                                    {prod.price_range.minimum_price.regular_price.currency} {currentPrice.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </Link>
                                        ))}
                                        <div
                                            onClick={() => {
                                                navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                                                setShowSuggestions(false);
                                            }}
                                            style={{
                                                padding: '10px',
                                                textAlign: 'center',
                                                fontSize: '13px',
                                                color: '#666',
                                                cursor: 'pointer',
                                                background: '#f9f9f9'
                                            }}
                                        >
                                            View all results for "{searchTerm}"
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '15px', color: '#888' }}>No results found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Icons */}
                    <div className="header-icons flex items-center gap-4">
                        <Link to="/cart" className="flex items-center gap-2" style={{ fontWeight: 600 }}>
                            <span style={{ fontSize: '1.2rem' }}>🛒</span>
                            <span>{cartCount}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="nav-bar bg-dark" style={{ borderTop: '1px solid #333' }}>
                <div style={{ padding: '0', width: '100%' }}>
                    <nav className="main-nav">
                        <ul className="main-menu">
                            {/* HOME link */}
                            <li className="menu-item">
                                <Link to="/">Home</Link>
                            </li>

                            {catLoading ? (
                                <li className="menu-item" style={{ color: '#999' }}>Loading...</li>
                            ) : (
                                visibleCategories.map(category => (
                                    <li key={category.uid} className="menu-item">
                                        <Link to={`/category/${category.uid}`}>
                                            {category.name}
                                            {category.children && category.children.length > 0 && (
                                                <ChevronDown size={14} style={{ marginLeft: '5px', verticalAlign: 'middle', opacity: 0.7 }} />
                                            )}
                                        </Link>

                                        {/* Dropdown for Subcategories */}
                                        {category.children && category.children.length > 0 && (
                                            <ul className="sub-menu">
                                                {category.children.map(child => (
                                                    <li key={child.uid}>
                                                        <Link to={`/category/${child.uid}`}>{child.name}</Link>
                                                        {child.children && child.children.length > 0 && (
                                                            <ul className="sub-menu">
                                                                {child.children.map(grandChild => (
                                                                    <li key={grandChild.uid}>
                                                                        <Link to={`/category/${grandChild.uid}`}>{grandChild.name}</Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))
                            )}

                            {/* Static Links to match screenshot if not in query */}
                            <li className="menu-item">
                                <Link to="#">Blog</Link>
                            </li>

                            {/* Static Deal Link */}
                            <li className="menu-item">
                                <Link to="#" style={{ color: '#ff4d4d' }}>Deals</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
