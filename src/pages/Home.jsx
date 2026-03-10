import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_HOME_DATA } from '../api/products';
import Hero from '../components/home/Hero';
import CategoryIcons from '../components/home/CategoryIcons';
import Brands from '../components/home/Brands';
import Features from '../components/home/Features';
import PromoBanner from '../components/home/PromoBanner';
import ProductCard from '../components/catalog/ProductCard';
import ProductSkeleton from '../components/catalog/ProductSkeleton';
import SEO from '../components/common/SEO';
import LazySection from '../components/common/LazySection';

const Home = () => {
    // Fetch all home data in one consolidated query
    const { loading, error, data } = useQuery(GET_HOME_DATA, {
        variables: { featuredSize: 4, trendingSize: 4, trendingSearch: 'audio' }
    });

    const promoProducts = data?.featuredProducts?.items || [];
    const trendingProducts = data?.trendingProducts?.items || [];

    const SkeletonGrid = () => (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
        </div>
    );

    return (
        <div className="home-page">
            <SEO
                title="Home"
                description="AV GEAR - Your premium source for high-fidelity audio equipment and home theater systems."
                ogType="website"
            />
            <Hero />
            
            {/* Critical sections above the fold or just below */}
            <LazySection height="200px">
                <CategoryIcons />
            </LazySection>

            <LazySection height="200px">
                <Brands />
            </LazySection>

            <LazySection height="400px">
                <Features />
            </LazySection>

            {/* Featured Section */}
            <div className="container" style={{ margin: '100px auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Treat Yourself or Someone Special</h2>
                    <p style={{ color: '#666' }}>Discover the perfect audio gift for any occasion.</p>
                </div>

                {loading ? (
                    <SkeletonGrid />
                ) : (
                    <div className="grid product-slider" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        {promoProducts.map(product => (
                            <ProductCard key={product.uid} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* Trending Products Section - Lazy Loaded */}
            <LazySection height="500px">
                <div className="container" style={{ margin: '100px auto' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Trending Products</h2>
                        <p style={{ color: '#666' }}>Most popular picks from our audiophile community.</p>
                    </div>

                    {loading ? (
                        <SkeletonGrid />
                    ) : (
                        <div className="grid product-slider" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                            {trendingProducts.map(product => (
                                <ProductCard key={product.uid} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </LazySection>

            <LazySection height="600px">
                <PromoBanner />
            </LazySection>
        </div>
    );
};

export default Home;
