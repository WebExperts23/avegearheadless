import React from 'react';

const Brands = () => {
    // Just placeholders for brands - in real app use SVGs
    const brands = ['Pioneer', 'DENON', 'Marantz', 'KENWOOD', 'Marshall', 'Klipsch', 'ALPINE'];

    return (
        <div className="container brands-section" style={{ textAlign: 'center', margin: '80px auto' }}>
            <h3 className="section-title" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '50px', color: '#222' }}>Trusted Brands We Carry</h3>
            <div className="brands-grid" style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '50px',
                alignItems: 'center',
                opacity: 0.4
            }}>
                {brands.map(brand => (
                    <span key={brand} style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{brand}</span>
                ))}
            </div>
        </div>
    );
};

export default Brands;
