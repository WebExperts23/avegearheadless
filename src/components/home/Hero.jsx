import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '../../api/products';
import { useCart } from '../../contexts/CartContext';
import ProductSkeleton from '../catalog/ProductSkeleton';
import OptimizedImage from '../common/OptimizedImage';

const Hero = () => {
    const { addToCart } = useCart();

    // Fetch 4 products for the Hero section
    const { loading, error, data } = useQuery(GET_PRODUCTS, {
        variables: { search: '', pageSize: 4 }
    });

    const products = data?.products?.items || [];

    return (
        <div className="hero-section" style={{
            position: 'relative',
            minHeight: '700px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            marginBottom: '0',
            paddingBottom: '120px'
        }}>
            {/* Background Image */}
            <div className="hero-bg" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url("/media/wysiwyg/Container.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                zIndex: 0
            }} role="img" aria-label="Hero Background"></div>

            <div className="container hero-container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', paddingTop: '100px' }}>
                <h1 className="hero-title" style={{
                    fontSize: '3.5rem',
                    fontWeight: '300',
                    color: '#333',
                    marginBottom: '10px',
                    letterSpacing: '-1.5px',
                    textTransform: 'uppercase'
                }}>
                    BIG SAVINGS ON OUR <span style={{ fontWeight: '800' }}>BEST BRANDS</span>
                </h1>

                {/* Product Promo Grid embedded in Hero */}
                <div className="hero-promo-grid product-slider" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px',
                    maxWidth: '1200px',
                    margin: '80px auto 0'
                }}>
                    {loading ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <ProductSkeleton key={i} />
                            ))}
                        </>
                    ) : products.map((product) => (
                        <div key={product.uid} className="hero-product-card" style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            padding: '30px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.5)'
                        }}>
                            <div style={{ height: '90px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                {product.small_image?.url ? (
                                    <OptimizedImage
                                        src={product.small_image.url}
                                        alt={product.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        priority={true} // Hero section products are above the fold
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#eee' }}></div>
                                )}
                            </div>

                            <p style={{
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '15px',
                                textAlign: 'center',
                                height: 'auto', // Changed from 3.2em
                                minHeight: '3.2em', // Maintain alignment
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3, // Allow up to 3 lines
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.2'
                            }}>{product.name}</p>

                            <div style={{ margin: '0 0 15px' }}>
                                {product.price_range.minimum_price.final_price && product.price_range.minimum_price.final_price.value < product.price_range.minimum_price.regular_price.value ? (
                                    <>
                                        <span style={{ fontSize: '0.85rem', color: '#888', textDecoration: 'line-through', marginRight: '8px' }}>
                                            {product.price_range.minimum_price.regular_price.currency} {product.price_range.minimum_price.regular_price.value.toFixed(2)}
                                        </span>
                                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#d32f2f' }}>
                                            {product.price_range.minimum_price.final_price.currency} {product.price_range.minimum_price.final_price.value.toFixed(2)}
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#333' }}>
                                        {product.price_range.minimum_price.regular_price.currency} {product.price_range.minimum_price.regular_price.value.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => addToCart(product)}
                                className="primary"
                                style={{ width: '100%', fontSize: '0.75rem', padding: '10px 0', borderRadius: '4px' }}
                            >
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;
