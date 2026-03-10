import React from 'react';
import { Headphones, Speaker, Gamepad2, Mic } from 'lucide-react';

const CategoryIcons = () => {
    const items = [
        { icon: Headphones, label: 'Headphones', desc: 'Experience crystal clear sound' },
        { icon: Speaker, label: 'Home Audio', desc: 'Upgrade your listening space' },
        { icon: Gamepad2, label: 'Gaming Products', desc: 'The best gear for pro gaming' },
        { icon: Mic, label: 'Car & Marine Audio', desc: 'Premium sound on the go' },
    ];

    return (
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
            <div className="category-icons-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginTop: '-60px',
                marginBottom: '80px'
            }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{
                        background: 'white',
                        padding: '35px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.3s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 15px 45px rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)'}
                    >
                        <div style={{ color: '#333', marginBottom: '8px' }}>
                            <item.icon size={36} strokeWidth={1} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#111' }}>{item.label}</span>
                        <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryIcons;
