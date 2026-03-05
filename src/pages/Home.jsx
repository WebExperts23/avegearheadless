import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '../api/products';
import Hero from '../components/home/Hero';
import CategoryIcons from '../components/home/CategoryIcons';
import Brands from '../components/home/Brands';
import Features from '../components/home/Features';
import PromoBanner from '../components/home/PromoBanner';
import ProductCard from '../components/catalog/ProductCard';


const Home = () => {
    // Fetch products for featured sections
    const { loading: promoLoading, data: promoData } = useQuery(GET_PRODUCTS, {
        variables: { search: '', pageSize: 4 }
    });

    const { loading: trendingLoading, data: trendingData } = useQuery(GET_PRODUCTS, {
        variables: { search: 'audio', pageSize: 4 } // Search for 'audio' to get trending items
    });

    return (
        <div className="home-page">
            <Hero />
            <CategoryIcons />
            <Brands />
            <Features />

            {/* Treat Yourself Section */}
            <div className="container" style={{ margin: '100px auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Treat Yourself or Someone Special</h2>
                    <p style={{ color: '#666' }}>Discover the perfect audio gift for any occasion.</p>
                </div>

                {promoLoading ? (
                    <p>Loading inspiration...</p>
                ) : (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        {promoData?.products?.items?.map(product => (
                            <ProductCard key={product.uid} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* Trending Products Section */}
            <div className="container" style={{ margin: '100px auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Trending Products</h2>
                    <p style={{ color: '#666' }}>Most popular picks from our audiophile community.</p>
                </div>

                {trendingLoading ? (
                    <p>Loading trends...</p>
                ) : (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        {trendingData?.products?.items?.map(product => (
                            <ProductCard key={product.uid} product={product} />
                        ))}
                    </div>
                )}
            </div>

            <PromoBanner />
        </div>
    );
};

export default Home;
