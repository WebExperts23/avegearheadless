import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const Checkout = () => {
    useEffect(() => {
        // Fallback redirect if the route somehow hits this component instead of the proxy
        // This is a safety measure in case React Router somehow resolves before the server proxy
        window.location.href = '/checkout';
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
            <h2 style={{ fontWeight: '700' }}>Redirecting to Checkout...</h2>
            <p style={{ color: '#666' }}>Please wait while we load the secure checkout page.</p>
        </div>
    );
};

export default Checkout;
