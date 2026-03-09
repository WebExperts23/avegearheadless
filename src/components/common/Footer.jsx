import React, { useState, useEffect } from 'react';
import { fetchAdminToken } from '../../api/client';
import './Footer.css';

const Footer = () => {
    const [blockContent, setBlockContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFooterBlock = async () => {
            try {
                const token = await fetchAdminToken();
                if (!token) throw new Error("Could not get admin token");

                const searchCriteria = '?searchCriteria[filter_groups][0][filters][0][field]=identifier&searchCriteria[filter_groups][0][filters][0][value]=headless-footer&searchCriteria[filter_groups][0][filters][0][condition_type]=eq';
                
                // Use the Vite proxy '/magento-api' to bypass CORS blocks on the Magento REST API
                const proxyUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_MAGENTO_BASE_URL || 'https://2fc1869dd5.nxcli.io');
                const endpoint = import.meta.env.DEV ? '/magento-api' : proxyUrl;

                const response = await fetch(`${endpoint}/rest/V1/cmsBlock/search${searchCriteria}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch block");
                
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    setBlockContent(data.items[0].content);
                }
            } catch (err) {
                console.error("Error fetching footer block:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFooterBlock();
    }, []);

    if (loading) {
        return (
            <footer style={{ backgroundColor: '#000', color: '#fff', paddingTop: '80px', paddingBottom: '40px', marginTop: '100px', minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #333', borderTopColor: '#00a651', borderRadius: '50%' }}></div>
            </footer>
        );
    }

    // Decode HTML entities and replace Magento shortcodes
    const decodedContent = (() => {
        if (!blockContent) return '';
        
        // 1. First, decode the HTML entities that Magento sends (like &lt; &gt; &quot;)
        const txt = document.createElement("textarea");
        txt.innerHTML = blockContent;
        let htmlSnippet = txt.value;

        // 2. Replace the Logo Widget Shortcode.
        // We use a flexible regex that handles both encoded quotes (&quot;) and regular quotes ("),
        // as well as any spacing variations.
        const logoWidgetPattern = /\{\{widget\s+type=(?:&quot;|")Magento\\Cms\\Block\\Widget\\Block(?:&quot;|")[^}]*block_id=(?:&quot;|")78(?:&quot;|")[^}]*\}\}/gi;
        const logoHtml = `
            <a href="/" style="text-decoration: none; color: #fff; font-size: 2.2rem; font-weight: 800; display: block; margin-bottom: 20px; letter-spacing: 1px;">
                AV<span style="color: #00a651;">GEAR</span>
            </a>
        `;
        htmlSnippet = htmlSnippet.replace(logoWidgetPattern, logoHtml);

        // 3. Replace the Newsletter Subscribe Block Shortcode
        const newsletterBlockPattern = /\{\{block\s+class=(?:&quot;|")Magento\\Newsletter\\Block\\Subscribe(?:&quot;|")[^}]*\}\}/gi;
        const newsletterHtml = `
            <div class="newsletter-form">
                <input type="email" placeholder="Enter your Email Address" />
                <button type="button">Subscribe</button>
            </div>
        `;
        htmlSnippet = htmlSnippet.replace(newsletterBlockPattern, newsletterHtml);

        return htmlSnippet;
    })();

    return (
        <footer style={{ backgroundColor: '#000', color: '#fff', margin: 0 }}>
            {/* Global CMS Footer */}
            {decodedContent ? (
                <div 
                    className="cms-footer-content"
                    dangerouslySetInnerHTML={{ __html: decodedContent }} 
                />
            ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Footer content configured in Admin is missing or empty.</p>
                </div>
            )}
        </footer>
    );
};

export default Footer;
