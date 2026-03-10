import React from 'react';
import { useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import { GET_BLOG_POSTS } from '../api/blog';
import BlogSidebar from '../components/blog/BlogSidebar';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useEffect } from 'react';
import SEO from '../components/common/SEO';


const Blog = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([{ label: 'Blog', path: '/blog' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const { loading, error, data } = useQuery(GET_BLOG_POSTS, {
        variables: {
            pageSize: 12,
            currentPage: 1,
            filter: searchQuery ? { title: { like: `%${searchQuery}%` } } : {}
        }
    });

    if (loading) return (
        <div className="blog-page">
            <div className="header" style={{ backgroundColor: '#f5f5f5', padding: '60px 0', textAlign: 'center' }}>
                <div className="container">
                    <div className="skeleton" style={{ width: '200px', height: '2.5rem', margin: '0 auto' }}></div>
                </div>
            </div>
            <div className="container" style={{ padding: '60px 0' }}>
                <div className="blog-layout">
                    <div className="blog-main-content">
                        <div className="grid blog-posts-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton" style={{ height: '400px', borderRadius: '18px' }}></div>
                            ))}
                        </div>
                    </div>
                    <div className="skeleton blog-sidebar-wrapper"></div>
                </div>
            </div>
        </div>
    );

    if (error) return <div className="container" style={{ padding: '60px 0' }}>Error loading posts: {error.message}</div>;

    const posts = data?.blogPosts?.items || [];

    return (
        <div className="blog-page">

            <SEO
                title={searchQuery ? `Search Results for "${searchQuery}" | Blog` : "Blog"}
                description="Insights, news, and gear guides from the AV Gear team."
                ogType="blog"
            />
            <div className="header" style={{ backgroundColor: '#f5f5f5', padding: '60px 0', textAlign: 'center', marginBottom: '40px' }}>
                <div className="container">
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 300 }}>
                        {searchQuery ? 'Search Results' : 'Latest'} <span style={{ fontWeight: 800 }}>{searchQuery ? `for "${searchQuery}"` : 'Stories'}</span>
                    </h1>
                    <p style={{ color: '#666', marginTop: '10px' }}>Insights, news, and gear guides from the AV Gear team.</p>
                </div>
            </div>

            <div className="container">
                <div className="blog-layout">
                    {/* Main Content */}
                    <div className="blog-main-content">
                        {posts.length > 0 ? (
                            <div className="grid blog-posts-grid" style={{ marginBottom: '80px' }}>
                                {posts.map(post => (
                                    <article key={post.post_id} className="blog-card" style={{
                                        background: '#fff',
                                        borderRadius: '18px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.3s'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Link to={`/blog/${post.identifier}`} style={{ display: 'block' }}>
                                            <div style={{ height: '200px', background: '#eee', overflow: 'hidden' }}>
                                                {(post.featured_list_image || post.featured_image) ? (
                                                    <img
                                                        src={post.featured_list_image || post.featured_image}
                                                        alt={post.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                                                {post.author?.name || 'Admin'} • {new Date(post.publish_time).toLocaleDateString()}
                                            </div>
                                            <h2 style={{ fontSize: '1.25rem', margin: '0 0 15px', lineHeight: 1.3 }}>
                                                <Link to={`/blog/${post.identifier}`} style={{ color: '#333' }}>{post.title}</Link>
                                            </h2>
                                            <p style={{
                                                fontSize: '0.9rem',
                                                color: '#666',
                                                margin: '0 0 20px',
                                                lineHeight: 1.6,
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {(() => {
                                                    const raw = post.short_filtered_content || post.filtered_content || '';
                                                    return raw
                                                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                                        .replace(/<[^>]*>?/gm, '')
                                                        .substring(0, 150) + '...';
                                                })()}
                                            </p>
                                            <Link
                                                to={`/blog/${post.identifier}`}
                                                style={{
                                                    marginTop: 'auto',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    color: 'var(--primary-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                Read Full Story →
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 0', background: '#f9f9f9', borderRadius: '18px' }}>
                                <h3 style={{ marginBottom: '10px' }}>No stories found</h3>
                                <p style={{ color: '#666' }}>Try a different search term or <Link to="/blog" style={{ color: 'var(--primary-color)' }}>view all stories</Link>.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="blog-sidebar-wrapper">
                        <BlogSidebar />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Blog;
