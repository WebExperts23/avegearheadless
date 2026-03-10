import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_BLOG_POST_DETAIL } from '../api/blog';
import BlogSidebar from '../components/blog/BlogSidebar';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useEffect } from 'react';
import SEO from '../components/common/SEO';

const PostDetail = () => {
    const { id } = useParams();
    const { setBreadcrumbs } = useBreadcrumbs();
    const { loading, error, data } = useQuery(GET_BLOG_POST_DETAIL, {
        variables: { urlKey: id }
    });

    const post = data?.blogPost;

    useEffect(() => {
        if (post) {
            setBreadcrumbs([
                { label: 'Blog', path: '/blog' },
                { label: post.title, path: `/blog/${id}` }
            ]);
        }
        return () => setBreadcrumbs([]);
    }, [post, id, setBreadcrumbs]);

    if (loading) return (
        <div className="container" style={{ padding: '100px 0' }}>
            <div className="blog-layout">
                <div className="blog-main-content">
                    <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: '18px', marginBottom: '40px' }}></div>
                    <div className="skeleton" style={{ width: '60%', height: '2rem', marginBottom: '20px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '10px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '10px' }}></div>
                    <div className="skeleton" style={{ width: '80%', height: '1rem' }}></div>
                </div>
            </div>
        </div>
    );

    if (error) return <div className="container" style={{ padding: '60px 0' }}>Error: {error.message}</div>;

    if (!post) return (
        <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
            <h2>Story not found</h2>
            <Link to="/blog" style={{ color: 'var(--primary-color)' }}>Back to Blog</Link>
        </div>
    );

    const structuredData = post ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'image': post.featured_image ? [post.featured_image] : [],
        'datePublished': post.publish_time,
        'author': {
            '@type': 'Person',
            'name': post.author?.name || 'Admin'
        }
    } : null;

    const stripHtml = (html) => html ? html.replace(/<[^>]*>?/gm, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').substring(0, 160) : '';

    return (
        <div className="post-detail-page">
            {post && (
                <SEO
                    title={post.meta_title || post.title}
                    description={post.meta_description || stripHtml(post.short_filtered_content || post.filtered_content)}
                    ogType="article"
                    ogImage={post.featured_image}
                    structuredData={structuredData}
                />
            )}
            {/* Header / Featured Image */}
            <div className="post-detail-hero">
                {post.featured_image && (
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="post-detail-hero-img"
                    />
                )}
                <div className="post-detail-hero-content">
                    <div className="container">
                        <div className="post-detail-hero-meta">
                            {post.author?.name || 'Admin'} • {new Date(post.publish_time).toLocaleDateString()}
                        </div>
                        <h1 className="post-detail-hero-title">{post.title}</h1>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="blog-layout" style={{ marginBottom: '100px' }}>
                    {/* Main Content */}
                    <div className="blog-main-content">
                        <Link to="/blog" style={{ display: 'inline-block', marginBottom: '30px', color: '#666', fontSize: '0.9rem' }}>
                            ← Back to all stories
                        </Link>

                        <div
                            className="post-content"
                            style={{
                                lineHeight: 1.8,
                                fontSize: '1.1rem',
                                color: '#333'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: (post.filtered_content || '')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                            }}
                        />

                        <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid #eee' }}>
                            <h3 style={{ marginBottom: '20px' }}>Share this story</h3>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                {/* Placeholder social sharing */}
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>f</div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>t</div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>in</div>
                            </div>
                        </div>
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

export default PostDetail;
