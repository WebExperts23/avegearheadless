import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart, cartItems, loading } = useCart();
    const { name, price_range, small_image, sku } = product;

    // Diagnostic log to catch SKU/Name mismatch
    console.log(`[ProductCardDebug] Rendering: name="${name}", sku="${sku}"`);

    const regularPrice = price_range.minimum_price.regular_price;
    const finalPrice = price_range.minimum_price.final_price;
    const hasDiscount = finalPrice && finalPrice.value < regularPrice.value;

    const [stockQty, setStockQty] = React.useState(null);
    const [isOutOfStock, setIsOutOfStock] = React.useState(product.stock_status === 'OUT_OF_STOCK');

    const cartItem = cartItems.find(item => item.product.sku === sku);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const isAtLimit = stockQty !== null && inCartQty >= stockQty;

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
        if (typeof stockQty !== 'number') return null; // Don't show numeric label if we don't have the number

        if (stockQty === 0) return 'Out of Stock';
        if (stockQty > 0 && stockQty <= 5) return `Only ${stockQty} Left`;
        return `In Stock (${stockQty})`;
    };

    const stockLabel = getStockLabel();

    return (
        <div className="product-card" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            opacity: (isOutOfStock || isAtLimit) ? 0.8 : 1
        }}>
            {/* Stock Badge */}
            {stockLabel && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    backgroundColor: (isOutOfStock || isAtLimit || (stockQty !== null && stockQty <= 5)) ? '#ffebee' : '#e8f5e9',
                    color: (isOutOfStock || isAtLimit || (stockQty !== null && stockQty <= 5)) ? '#c62828' : '#2e7d32',
                    zIndex: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {stockLabel}
                </div>
            )}

            <Link to={`/product/${sku}`} style={{ display: 'block', marginBottom: '15px' }}>
                <div style={{ aspectRatio: '1/1', overflow: 'hidden', marginBottom: '15px', borderRadius: '8px' }}>
                    {small_image?.url ? (
                        <img
                            src={small_image.url}
                            alt={name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f5', color: '#ccc' }}>No Image</div>
                    )}
                </div>
                <h3 style={{
                    fontSize: '0.95rem',
                    margin: '0 0 8px',
                    color: '#333',
                    fontWeight: 600,
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    height: '2.8em' // approx 2 lines
                }}>{name}</h3>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {hasDiscount ? (
                        <>
                            <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.9rem' }}>
                                {regularPrice.currency} {regularPrice.value.toFixed(2)}
                            </span>
                            <span style={{ color: '#d32f2f' }}>
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
                className="primary"
                style={{ width: '100%', marginTop: 'auto' }}
                disabled={isOutOfStock || isAtLimit || loading}
            >
                {loading ? 'Processing...' : (isOutOfStock ? 'Out of Stock' : (isAtLimit ? 'Limit Reached' : 'Add to Cart'))}
            </button>
        </div>
    );
};

export default ProductCard;
