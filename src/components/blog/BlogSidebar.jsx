import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_BLOG_POSTS } from '../../api/blog';
import { Search, Clock } from 'lucide-react';

const BlogSidebar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Fetch recent 5 posts for sidebar widget
    const { data: recentData } = useQuery(GET_BLOG_POSTS, {
        variables: { pageSize: 5, currentPage: 1 }
    });

    const recentPosts = recentData?.blogPosts?.items || [];

    // Lazy query for search suggestions
    const [fetchSuggestions, { data: suggestionData }] = useLazyQuery(GET_BLOG_POSTS);
    const suggestions = suggestionData?.blogPosts?.items || [];

    // Debounce Search Suggestions
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim().length >= 1) {
                fetchSuggestions({
                    variables: {
                        pageSize: 5,
                        filter: { title: { like: `%${searchTerm}%` } }
                    }
                });
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchSuggestions]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/blog?q=${encodeURIComponent(searchTerm)}`);
            setShowSuggestions(false);
        }
    };

    return (
        <aside className="blog-sidebar" style={{
            position: 'sticky',
            top: '20px'
        }}>
            {/* Search Widget */}
            <div className="sidebar-widget blog-search-widget" style={{
                background: '#fff',
                padding: '25px',
                borderRadius: '18px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                marginBottom: '30px',
                position: 'relative'
            }}
                ref={dropdownRef}
            >
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 700 }}>Search <span style={{ color: 'var(--primary-color)' }}>Blog</span></h3>
                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search stories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => searchTerm.length >= 1 && setShowSuggestions(true)}
                        style={{
                            width: '100%',
                            padding: '12px 15px 12px 40px',
                            borderRadius: '30px',
                            border: '1px solid #eee',
                            fontSize: '0.9rem',
                            outline: 'none',
                            background: '#f9f9f9',
                            fontFamily: 'inherit'
                        }}
                    />
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#999'
                        }}
                    />
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchTerm.length >= 1 && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        marginTop: '10px',
                        overflow: 'hidden',
                        padding: '10px 0'
                    }}>
                        {suggestions.length > 0 ? (
                            <>
                                {suggestions.map(post => (
                                    <Link
                                        key={post.post_id}
                                        to={`/blog/${post.identifier}`}
                                        onClick={() => {
                                            setShowSuggestions(false);
                                            setSearchTerm('');
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 20px',
                                            textDecoration: 'none',
                                            color: '#333',
                                            transition: 'background 0.2s',
                                            borderBottom: '1px solid #f5f5f5'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#eee' }}>
                                            <img src={post.featured_list_image || post.featured_image || 'https://via.placeholder.com/40'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {post.title}
                                        </div>
                                    </Link>
                                ))}
                                <div
                                    onClick={handleSearch}
                                    style={{
                                        padding: '12px 20px',
                                        textAlign: 'center',
                                        fontSize: '0.8rem',
                                        color: 'var(--primary-color)',
                                        cursor: 'pointer',
                                        fontWeight: 700
                                    }}
                                >
                                    See all results →
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '15px 20px', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                                No stories found for "{searchTerm}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Posts Widget */}
            <div className="sidebar-widget blog-recent-widget" style={{
                background: '#fff',
                padding: '25px',
                borderRadius: '18px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 700 }}>Recent <span style={{ color: 'var(--primary-color)' }}>Posts</span></h3>
                <div className="recent-posts-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recentPosts.map(post => (
                        <div key={post.post_id} className="recent-post-item" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <Link to={`/blog/${post.identifier}`} style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: '#eee' }}>
                                <img
                                    src={post.featured_list_image || post.featured_image || 'https://via.placeholder.com/60'}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </Link>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <h4 style={{ fontSize: '0.9rem', margin: '0 0 5px', lineHeight: 1.3, fontWeight: 600 }}>
                                    <Link to={`/blog/${post.identifier}`} style={{
                                        color: '#333',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {post.title}
                                    </Link>
                                </h4>
                                <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Clock size={12} />
                                    {new Date(post.publish_time).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default BlogSidebar;
