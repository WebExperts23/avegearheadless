import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Heart } from 'lucide-react';
import OptimizedImage from '../common/OptimizedImage';

const ProductCard = ({ product, viewMode = 'grid' }) => {
    const { addToCart, cartItems, loading: cartLoading } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItemId, loading: wishlistLoading } = useWishlist();
    const { name, price_range, small_image, sku } = product;

    // Diagnostic log to catch SKU/Name mismatch
    console.log(`[ProductCardDebug] Rendering: name="${name}", sku="${sku}", viewMode="${viewMode}"`);

    const regularPrice = price_range.minimum_price.regular_price;
    const finalPrice = price_range.minimum_price.final_price;
    const hasDiscount = finalPrice && finalPrice.value < regularPrice.value;

    const [stockQty, setStockQty] = React.useState(null);
    const [isOutOfStock, setIsOutOfStock] = React.useState(product.stock_status === 'OUT_OF_STOCK');

    const cartItem = cartItems.find(item => item.product.sku === sku);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const isAtLimit = stockQty !== null && inCartQty >= stockQty;

    const inWishlist = isInWishlist(sku);
    const wishlistItemId = getWishlistItemId(sku);
    const isProcessing = cartLoading || wishlistLoading;

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWishlist) {
            await removeFromWishlist(wishlistItemId);
        } else {
            await addToWishlist(sku);
        }
    };

    React.useEffect(() => {
        let cancelled = false;
        if (isOutOfStock) return;

        import('../../api/stock').then(({ getSalableQty }) => {
            getSalableQty(sku).then(qty => {
                if (!cancelled) {
                    if (typeof qty === 'number') {
                        setStockQty(qty);
                        if (qty === 0) setIsOutOfStock(true);
                    }
                }
            });
        });

        return () => { cancelled = true; };
    }, [sku, isOutOfStock]);

    const getStockLabel = () => {
        if (isOutOfStock) return 'Out of Stock';
        if (isAtLimit) return 'Max in Cart';
        if (typeof stockQty !== 'number') return null;

        if (stockQty === 0) return 'Out of Stock';
        if (stockQty > 0 && stockQty <= 5) return `Only ${stockQty} Left`;
        return `In Stock (${stockQty})`;
    };

    const stockLabel = getStockLabel();

    const isList = viewMode === 'list';

    return (
        <div className="product-card" style={{
            background: 'white',
            borderRadius: '18px',
            padding: isList ? '25px' : '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f0f0f0',
            textAlign: isList ? 'left' : 'center',
            display: 'flex',
            flexDirection: isList ? 'row' : 'column',
            gap: isList ? '30px' : '0',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            opacity: (isOutOfStock || isAtLimit) ? 0.8 : 1,
            transition: 'transform 0.3s, box-shadow 0.3s'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
        >
            {/* Stock Badge */}
            {stockLabel && (
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    padding: '4px 10px',
                    borderRadius: '30px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    backgroundColor: (isOutOfStock || isAtLimit || (stockQty !== null && stockQty <= 5)) ? '#ffebee' : '#e8f5e9',
                    color: (isOutOfStock || isAtLimit || (stockQty !== null && stockQty <= 5)) ? '#c62828' : '#2e7d32',
                    zIndex: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    {stockLabel}
                </div>
            )}

            {/* Wishlist Icon */}
            <button
                onClick={handleWishlistToggle}
                style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: inWishlist ? '#ff4d4d' : '#888',
                    zIndex: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
                <Heart size={18} fill={inWishlist ? "#ff4d4d" : "none"} strokeWidth={inWishlist ? 0 : 2} />
            </button>

            <div style={{
                flex: isList ? '0 0 240px' : 'none',
                marginBottom: isList ? '0' : '15px'
            }}>
                <Link to={`/product/${sku}`} style={{ display: 'block' }}>
                    <div style={{ aspectRatio: '1/1', overflow: 'hidden', borderRadius: '12px', background: '#fff' }}>
                        {small_image?.url ? (
                            <OptimizedImage
                                src={small_image.url}
                                alt={name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                loading="lazy"
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f5', color: '#ccc' }}>No Image</div>
                        )}
                    </div>
                </Link>
            </div>

            <div style={{
                flex: isList ? 1 : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: isList ? 'center' : 'flex-start'
            }}>
                <Link to={`/product/${sku}`} style={{ display: 'block', textDecoration: 'none' }}>
                    <h3 style={{
                        fontSize: isList ? '1.2rem' : '0.95rem',
                        margin: '0 0 12px',
                        color: '#333',
                        fontWeight: 700,
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: isList ? 2 : 3,
                        WebkitBoxOrient: 'vertical',
                        height: isList ? 'auto' : '4.2em',
                        fontFamily: 'inherit'
                    }}>{name}</h3>

                    {isList && product.short_description?.html && (
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#666',
                            margin: '-5px 0 15px',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                        }}>
                            {product.short_description.html.replace(/<[^>]*>?/gm, '')}
                        </div>
                    )}

                    <div style={{
                        fontSize: isList ? '1.4rem' : '1.1rem',
                        fontWeight: '800',
                        color: '#111',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isList ? 'flex-start' : 'center',
                        gap: '10px',
                        marginBottom: isList ? '20px' : '15px'
                    }}>
                        {hasDiscount ? (
                            <>
                                <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.8em', fontWeight: 500 }}>
                                    {regularPrice.currency} {regularPrice.value.toFixed(2)}
                                </span>
                                <span style={{ color: 'var(--primary-color)' }}>
                                    {finalPrice.currency} {finalPrice.value.toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span>
                                {regularPrice.currency} {regularPrice.value.toFixed(2)}
                            </span>
                        )}
                    </div>
                </Link>

                <button
                    onClick={() => addToCart(product)}
                    className="primary add-to-cart-btn"
                    style={{
                        width: isList ? 'auto' : '100%',
                        alignSelf: isList ? 'flex-start' : 'stretch',
                        marginTop: 'auto',
                        padding: isList ? '12px 30px' : '10px 20px',
                        borderRadius: '30px',
                        minHeight: '44px'
                    }}
                    disabled={isOutOfStock || isAtLimit || isProcessing}
                >
                    {isProcessing ? 'Processing...' : (isOutOfStock ? 'Out of Stock' : (isAtLimit ? 'Limit Reached' : 'Add to Cart'))}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
