import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '../../api/products';
import { useCart } from '../../contexts/CartContext';

const Hero = () => {
    const { addToCart } = useCart();

    // Fetch 4 products for the Hero section
    const { loading, error, data } = useQuery(GET_PRODUCTS, {
        variables: { search: '', pageSize: 4 }
    });

    const products = data?.products?.items || [];

    return (
        <div style={{
            position: 'relative',
            minHeight: '700px',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            marginBottom: '0',
            paddingBottom: '120px'
        }}>
            {/* Background Image */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url("https://2fc1869dd5.nxcli.io/media/wysiwyg/Container.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                zIndex: 0
            }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', paddingTop: '100px' }}>
                <h1 style={{
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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px',
                    maxWidth: '1200px',
                    margin: '80px auto 0'
                }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', padding: '40px' }}>Loading products...</div>
                    ) : products.map((product) => (
                        <div key={product.uid} style={{
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
                                    <img
                                        src={product.small_image.url}
                                        alt={product.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
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
                                height: '2.5em',
                                overflow: 'hidden'
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
