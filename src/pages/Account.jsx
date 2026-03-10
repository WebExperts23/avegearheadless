import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import {
    User,
    Package,
    MapPin,
    LogOut,
    ChevronRight,
    Clock,
    CreditCard,
    Shield
} from 'lucide-react';

const Account = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([{ label: 'My Account', path: '/account' }]);
        if (!loading && !user) {
            navigate('/login');
        }
        return () => setBreadcrumbs([]);
    }, [user, loading, navigate, setBreadcrumbs]);

    if (loading) return (
        <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
            <div className="skeleton" style={{ width: '200px', height: '40px', margin: '0 auto 20px' }}></div>
            <div className="skeleton" style={{ width: '100%', height: '400px' }}></div>
        </div>
    );

    if (!user) return null;

    const stats = [
        { icon: <Package size={20} />, label: 'Total Orders', value: user.orders?.items?.length || 0 },
        { icon: <MapPin size={20} />, label: 'Addresses', value: user.addresses?.length || 0 },
        { icon: <Clock size={20} />, label: 'Membership', value: 'Pro Member' }
    ];

    return (
        <div className="container account-page" style={{ padding: '60px 0' }}>
            <div className="account-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px' }}>
                        Hello, <span style={{ color: 'var(--primary-color)' }}>{user.firstname}!</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>Welcome to your personal dashboard.</p>
                </div>
                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: '1px solid #eee',
                        background: '#fff',
                        color: '#666',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fcfcfc';
                        e.currentTarget.style.color = '#e53e3e';
                        e.currentTarget.style.borderColor = '#fed2d2';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#666';
                        e.currentTarget.style.borderColor = '#eee';
                    }}
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>

            {/* Quick Stats */}
            <div className="account-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '50px' }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{
                        background: '#fff',
                        padding: '30px',
                        borderRadius: '24px',
                        border: '1px solid #eee',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(230, 126, 34, 0.1)',
                            borderRadius: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color)'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="account-main-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                {/* Orders Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Clock size={24} color="var(--primary-color)" /> Recent Orders
                        </h2>
                        <Link to="#" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>View All Orders</Link>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #eee', overflow: 'hidden' }}>
                        {user.orders?.items?.length > 0 ? (
                            <div>
                                {user.orders.items.map((order, i) => (
                                    <div key={order.id} className="account-order-item" style={{
                                        padding: '25px',
                                        borderBottom: i === user.orders.items.length - 1 ? 'none' : '1px solid #f5f5f5',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '5px' }}>Order #{order.number}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#888' }}>Placed on {new Date(order.order_date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="account-order-details" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '40px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', marginBottom: '2px' }}>Total</div>
                                                <div style={{ fontWeight: '800' }}>{order.total.grand_total.currency} {order.total.grand_total.value.toFixed(2)}</div>
                                            </div>
                                            <div style={{
                                                background: order.status === 'complete' ? '#e6f8f1' : '#fef4e6',
                                                color: order.status === 'complete' ? '#27ae60' : '#f39c12',
                                                padding: '6px 14px',
                                                borderRadius: '30px',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase'
                                            }}>
                                                {order.status}
                                            </div>
                                            <ChevronRight size={20} color="#ccc" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
                                <Package size={40} style={{ marginBottom: '15px', opacity: 0.3 }} />
                                <p>You haven't placed any orders yet.</p>
                                <button className="outline" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Start Shopping</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Details & Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Profile Summary */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #eee' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={20} color="var(--primary-color)" /> Account Info
                        </h3>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '3px' }}>Full Name</div>
                            <div style={{ fontWeight: '600' }}>{user.firstname} {user.lastname}</div>
                        </div>
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '3px' }}>Email Address</div>
                            <div style={{ fontWeight: '600' }}>{user.email}</div>
                        </div>
                        <button className="outline" style={{ width: '100%', fontSize: '0.9rem' }}>Edit Profile</button>
                    </div>

                    {/* Default Address */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #eee' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={20} color="var(--primary-color)" /> Primary Address
                        </h3>
                        {user.addresses?.find(a => a.default_shipping) ? (
                            <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
                                {(() => {
                                    const addr = user.addresses.find(a => a.default_shipping);
                                    return (
                                        <>
                                            <div style={{ fontWeight: '700', marginBottom: '5px' }}>{addr.firstname} {addr.lastname}</div>
                                            <div>{addr.street[0]}</div>
                                            <div>{addr.city}, {addr.region.region} {addr.postcode}</div>
                                            <div>{addr.country_code}</div>
                                            <div style={{ marginTop: '10px', color: '#888' }}>T: {addr.telephone}</div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>No default address set.</p>
                        )}
                        <button className="outline" style={{ width: '100%', fontSize: '0.9rem', marginTop: '20px' }}>Manage Addresses</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
