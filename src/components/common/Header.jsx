import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_INITIAL_DATA, GET_PRODUCTS } from '../../api/products';
import OptimizedImage from '../common/OptimizedImage';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, ChevronDown, Search, User, ShoppingCart, Heart } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';

const Header = () => {
    const { cartItems } = useCart();
    const { items: wishlistItems } = useWishlist();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);

    // Lazy query for suggestions
    const [fetchSuggestions, { data: searchData, loading: searchLoading }] = useLazyQuery(GET_PRODUCTS);

    // Consolidated query for initial data
    const { loading: initLoading, data: initData } = useQuery(GET_INITIAL_DATA);

    const containerRef = useRef(null);

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 1) {
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
    const categories = initData?.categoryList?.[0]?.children || [];
    const visibleCategories = categories.filter(cat => cat.include_in_menu === 1);

    const logoSrc = initData?.storeConfig?.header_logo_src;
    const mediaBase = initData?.storeConfig?.secure_base_media_url;
    const logoAlt = initData?.storeConfig?.logo_alt || 'AV Gear';

    const fullLogoUrl = logoSrc && mediaBase ?
        (logoSrc.startsWith('http') ? logoSrc : `${mediaBase}logo/${logoSrc}`)
        : null;

    const suggestions = searchData?.products?.items || [];

    return (
        <header>
            {/* Top Bar - Desktop Only */}
            <div className="top-bar bg-dark desktop-only-topbar" style={{ padding: '8px 0', fontSize: '12px', borderBottom: '1px solid #333' }}>
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

            {/* Mobile Sidebar Overlay */}
            <div 
                className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar Drawer */}
            <div className={`mobile-sidebar-root ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="mobile-sidebar-header">
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Menu</span>
                    <button type="button" className="close-mobile-menu" onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}>
                        &times;
                    </button>
                </div>
                <div className="mobile-sidebar-content">
                    <ul className="mobile-nav-menu">
                        <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>
                        
                        {initLoading ? null : (
                            visibleCategories.map(category => (
                                <li key={category.uid} className={`mobile-has-children ${expandedMobileCategory === category.uid ? 'expanded' : ''}`}>
                                    <div className="mobile-nav-link-row">
                                        <Link to={`/${category.url_key}.html`} onClick={() => setIsMobileMenuOpen(false)}>
                                            {category.name}
                                        </Link>
                                        {category.children && category.children.length > 0 && (
                                            <button 
                                                className="mobile-expand-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setExpandedMobileCategory(prev => prev === category.uid ? null : category.uid);
                                                }}
                                            >
                                                <ChevronDown size={20} style={{ transform: expandedMobileCategory === category.uid ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {category.children && category.children.length > 0 && (
                                        <ul className="mobile-sub-menu">
                                            {category.children.map(child => (
                                                <li key={child.uid}>
                                                    <Link to={`/${child.url_key}.html`} onClick={() => setIsMobileMenuOpen(false)}>{child.name}</Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))
                        )}
                        <li><Link to="/blog" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link></li>
                        <li><Link to="#" style={{ color: '#ff4d4d' }} onClick={() => setIsMobileMenuOpen(false)}>Deals</Link></li>
                    </ul>
                    
                    <div className="mobile-nav-footer">
                        <Link to={user ? "/account" : "/login"} onClick={() => setIsMobileMenuOpen(false)}>
                            <User size={18} /> <span>{user ? 'My Account' : 'Sign In'}</span>
                        </Link>
                        <Link to="#" onClick={() => setIsMobileMenuOpen(false)}>Find a Store</Link>
                        <Link to="#" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</Link>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="main-header" style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                <div className="container header-primary-row flex items-center justify-between">
                    
                    {/* Hamburger Toggle (Mobile Only) */}
                    <button 
                        type="button"
                        className="mobile-menu-toggle"
                        onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(true); }}
                    >
                        <Menu size={28} />
                    </button>

                    {/* Logo */}
                    <Link to="/" className="logo header-logo">
                        {fullLogoUrl ? (
                            <OptimizedImage 
                                src={fullLogoUrl} 
                                alt={logoAlt} 
                                style={{ maxHeight: '50px' }} 
                                priority={true} 
                            />
                        ) : (
                            <span style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>AV<span style={{ color: 'var(--primary-color)' }}>GEAR</span></span>
                        )}
                    </Link>

                    {/* Search Bar */}
                    <div className="search-bar header-search-container" ref={containerRef}>
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
                                onFocus={() => searchTerm.length >= 1 && setShowSuggestions(true)}
                                style={{
                                    width: '100%',
                                    padding: '12px 25px',
                                    borderRadius: '30px',
                                    border: '1px solid #ddd',
                                    outline: 'none',
                                    background: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button type="submit" style={{
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#333',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Search size={20} />
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
                    <div className="header-icons flex items-center header-icons-container">
                        <Link to={user ? "/account" : "/login"} className="desktop-account-icon" style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} title={user ? "My Account" : "Sign In"}>
                            <User size={24} strokeWidth={1.5} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: '700', lineHeight: 1 }}>{user ? 'Welcome' : 'Guest'}</span>
                                <span style={{ fontSize: '13px', fontWeight: '700' }}>{user ? user.firstname : 'Sign In'}</span>
                            </div>
                        </Link>

                        <Link to="/wishlist" className="flex items-center" style={{ position: 'relative', color: '#333' }} title="Wishlist">
                            <Heart size={24} strokeWidth={1.5} />
                            {wishlistItems.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: '#ff4d4d',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    minWidth: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/cart" className="flex items-center" style={{ position: 'relative', color: '#333' }} title="Cart">
                            <ShoppingCart size={24} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: '#00cc66',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    minWidth: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Menu (Desktop Only) */}
            <div className="nav-bar bg-dark desktop-nav-bar" style={{ borderTop: '1px solid #333' }}>
                <div style={{ padding: '0', width: '100%' }}>
                    <nav className="main-nav">
                        <ul className="main-menu">
                            {/* HOME link */}
                            <li className="menu-item">
                                <Link to="/">Home</Link>
                            </li>

                            {initLoading ? null : (
                                visibleCategories.map(category => (
                                    <li key={category.uid} className="menu-item">
                                        <Link to={`/${category.url_key}.html`}>
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
                                                        <Link to={`/${child.url_key}.html`}>{child.name}</Link>
                                                        {child.children && child.children.length > 0 && (
                                                            <ul className="sub-menu">
                                                                {child.children.map(grandChild => (
                                                                    <li key={grandChild.uid}>
                                                                        <Link to={`/${grandChild.url_key}.html`}>{grandChild.name}</Link>
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
                                <Link to="/blog">Blog</Link>
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
