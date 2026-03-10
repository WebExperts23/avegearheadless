import React from 'react';
import { Truck, CheckCircle, ShieldCheck, Clock } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, desc }) => (
    <div style={{
        background: '#222',
        padding: '30px 20px',
        borderRadius: '16px',
        textAlign: 'center',
        color: 'white',
        border: '1px solid #333'
    }}>
        <div style={{ color: 'var(--primary-color)', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <Icon size={32} />
        </div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--primary-color)' }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: '#999', margin: 0 }}>{desc}</p>
    </div>
);

const Features = () => {
    return (
        <div className="features-section" style={{ backgroundColor: '#111', padding: '100px 0', marginTop: '60px' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '80px', color: 'white' }}>
                    <h2 className="section-title white" style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '15px' }}>Why AV<span style={{ color: 'var(--primary-color)' }}>Gear</span></h2>
                    <p style={{ color: '#aaa', fontSize: '1.1rem' }}>Your trusted partner in premium audio</p>
                </div>

                <div className="grid features-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <FeatureItem icon={ShieldCheck} title="Genuine Brands" desc="100% Authentic Products" />
                    <FeatureItem icon={Clock} title="40 Years Experience" desc="Trusted by audiophiles" />
                    <FeatureItem icon={CheckCircle} title="Best Support" desc="Expert advice anytime" />
                    <FeatureItem icon={Truck} title="Fast Shipping" desc="Free over $200" />
                </div>
            </div>
        </div>
    );
};

export default Features;
