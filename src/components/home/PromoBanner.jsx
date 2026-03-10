import React from 'react';

const PromoBanner = () => {
    return (
        <div className="container" style={{ margin: '80px auto' }}>
            <div className="promo-banner" style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '600px',
                backgroundImage: 'url("/promo-bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '0 80px'
            }}>
                {/* Fallback if image fails */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.2)'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '400px', color: 'white' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '20px' }}>
                        Sound That Completes Your Space
                    </h2>
                    <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '30px' }}>
                        Premium home audio experience.
                    </p>
                    <button className="primary" style={{ padding: '15px 40px' }}>
                        Explore More
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoBanner;
