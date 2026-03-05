import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '../api/products';
import { useCart } from '../contexts/CartContext';

const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const { addToCart } = useCart();

    const { loading, error, data, refetch } = useQuery(GET_PRODUCTS, {
        variables: { search: query, pageSize: 20 }
    });

    useEffect(() => {
        refetch({ search: query });
    }, [query, refetch]);

    if (loading) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Searching for "{query}"...</div>;
    if (error) return <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'red' }}>Error: {error.message}</div>;

    const products = data?.products?.items || [];

    return (
        <div className="search-page" style={{ padding: 'var(--spacing-xl) 0', minHeight: '60vh' }}>
            <div className="container">
                <h1 style={{ marginBottom: '20px' }}>Search Results for: <span style={{ color: 'var(--primary-color)' }}>{query}</span></h1>

                {products.length === 0 ? (
                    <p>No products found for your search.</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '30px'
                    }}>
                        {products.map(product => (
                            <div key={product.uid} style={{
                                background: 'white',
                                border: '1px solid #eee',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}>
                                <Link to={`/product/${product.sku}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                                        {product.small_image?.url ? (
                                            <img src={product.small_image.url} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {product.name}
                                    </h3>
                                    {(() => {
                                        const regularPrice = product.price_range.minimum_price.regular_price.value;
                                        const finalPriceNode = product.price_range.minimum_price.final_price;
                                        const currentPrice = (finalPriceNode && finalPriceNode.value < regularPrice) ? finalPriceNode.value : regularPrice;
                                        const isDiscounted = currentPrice < regularPrice;
                                        return (
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: 'auto', marginBottom: '15px' }}>
                                                {isDiscounted && (
                                                    <span style={{ fontSize: '0.9rem', color: '#888', textDecoration: 'line-through', marginRight: '8px', fontWeight: 'normal' }}>
                                                        {product.price_range.minimum_price.regular_price.currency} {regularPrice.toFixed(2)}
                                                    </span>
                                                )}
                                                <span style={{ color: isDiscounted ? '#d32f2f' : '#333' }}>
                                                    {product.price_range.minimum_price.regular_price.currency} {currentPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </Link>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="primary"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px' }}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
