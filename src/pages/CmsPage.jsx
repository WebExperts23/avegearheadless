import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_CMS_PAGE } from '../api/products';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const CmsPage = ({ identifier: propIdentifier }) => {
    const { identifier: urlIdentifier } = useParams();
    const identifier = propIdentifier || urlIdentifier;
    const { setBreadcrumbs } = useBreadcrumbs();

    const { loading, error, data } = useQuery(GET_CMS_PAGE, {
        variables: { identifier },
        skip: !identifier,
        fetchPolicy: 'cache-and-network',
    });

    useEffect(() => {
        if (data?.cmsPage) {
            setBreadcrumbs([{ label: data.cmsPage.title, path: `/${identifier}` }]);
            document.title = `${data.cmsPage.meta_title || data.cmsPage.title} | AV Gear`;
        }
        return () => {
            setBreadcrumbs([]);
            document.title = 'AV Gear';
        };
    }, [data, identifier, setBreadcrumbs]);

    if (loading) {
        return (
            <div className="container" style={{ padding: '60px 20px', minHeight: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #eee', borderTopColor: 'var(--primary-color)', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (error || !data?.cmsPage) {
        return (
            <div className="container" style={{ padding: '60px 20px', minHeight: '50vh', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Page Not Found</h1>
                <p style={{ color: '#666' }}>We couldn't find the page you were looking for.</p>
            </div>
        );
    }

    const { title, content_heading, content } = data.cmsPage;

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '60vh', padding: '40px 0' }}>
            <div className="container">
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '40px 50px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                    border: '1px solid #eaeaea'
                }}>
                    {(content_heading || title) && (
                        <h1 style={{ 
                            fontSize: '2.5rem', 
                            fontWeight: '800', 
                            marginBottom: '30px', 
                            color: '#111',
                            borderBottom: '2px solid #eee',
                            paddingBottom: '20px'
                        }}>
                            {content_heading || title}
                        </h1>
                    )}
                    {/* Render Magento CMS content safely */}
                    <div 
                        className="cms-content"
                        dangerouslySetInnerHTML={{ 
                            __html: (() => {
                                // Create a textarea to let the browser decode HTML entities like &lt; to <
                                const txt = document.createElement("textarea");
                                txt.innerHTML = content;
                                return txt.value;
                            })()
                        }}
                    />
                </div>
            </div>

            {/* Scoped styles for common Magento CMS markup */}
            <style>{`
                .cms-content {
                    color: #444;
                    line-height: 1.8;
                    font-size: 1.05rem;
                }
                .cms-content h2, 
                .cms-content h3 {
                    color: #111;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    font-weight: 700;
                }
                .cms-content p {
                    margin-bottom: 20px;
                }
                .cms-content a {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 600;
                }
                .cms-content a:hover {
                    text-decoration: underline;
                }
                .cms-content ul, 
                .cms-content ol {
                    margin-bottom: 20px;
                    padding-left: 20px;
                }
                .cms-content li {
                    margin-bottom: 10px;
                }
            `}</style>
        </div>
    );
};

export default CmsPage;
