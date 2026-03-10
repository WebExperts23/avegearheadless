import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { fetchAdminToken } from '../../api/client';
import { SUBSCRIBE_NEWSLETTER } from '../../api/newsletter';
import './Footer.css';

const Footer = () => {
    const [blockContent, setBlockContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [subscribeEmailToNewsletter] = useMutation(SUBSCRIBE_NEWSLETTER);

    useEffect(() => {
        const fetchFooterBlock = async () => {
            const magentoBaseUrl = import.meta.env.VITE_MAGENTO_BASE_URL || 'https://2fc1869dd5.nxcli.io';
            const searchCriteria = '?searchCriteria[filter_groups][0][filters][0][field]=identifier&searchCriteria[filter_groups][0][filters][0][value]=headless-footer&searchCriteria[filter_groups][0][filters][0][condition_type]=eq';

            const fetchWithEndpoint = async (apiPrefix) => {
                try {
                    const token = await fetchAdminToken();
                    if (!token) throw new Error("Could not get admin token");

                    console.log(`[Footer] Attempting fetch with prefix: ${apiPrefix}`);
                    const response = await fetch(`${apiPrefix}/rest/V1/cmsBlock/search${searchCriteria}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Status: ${response.status} - ${errorText}`);
                    }
                    
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        return data.items[0].content;
                    }
                    return null;
                } catch (err) {
                    console.warn(`[Footer] Fetch failed for ${apiPrefix}:`, err.message);
                    return null;
                }
            };

            setLoading(true);
            
            // 1. Try proxied endpoint (standard for Vite/Vercel)
            let content = await fetchWithEndpoint('/magento-api');
            
            // 2. Fallback to absolute URL (supports direct staging access)
            if (!content) {
                console.log("[Footer] Proxied fetch failed, trying absolute URL...");
                content = await fetchWithEndpoint(magentoBaseUrl);
            }

            if (content) {
                setBlockContent(content);
            } else {
                console.error("[Footer] All footer fetch attempts failed.");
            }
            
            setLoading(false);
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
                <input type="email" class="newsletter-input" placeholder="Enter your Email Address" />
                <button type="button" class="newsletter-submit-btn">Subscribe</button>
            </div>
            <div class="newsletter-message" style="margin-top: 10px; font-size: 0.85rem; height: 20px;"></div>
        `;
        htmlSnippet = htmlSnippet.replace(newsletterBlockPattern, newsletterHtml);

        return htmlSnippet;
    })();

    // Handle Event Delegation for raw HTML
    const handleFooterClick = async (e) => {
        // Did they click the subscribe button?
        if (e.target && e.target.classList.contains('newsletter-submit-btn')) {
            e.preventDefault();
            
            const btn = e.target;
            const container = btn.closest('.newsletter-form');
            const input = container.querySelector('.newsletter-input');
            const msgBox = container.nextElementSibling;
            
            const email = input.value.trim();
            
            // Simple validation
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                msgBox.textContent = 'Please enter a valid email address.';
                msgBox.style.color = '#ff4d4d';
                return;
            }

            // UI Loading state
            btn.disabled = true;
            btn.textContent = 'Subscribing...';
            msgBox.textContent = '';

            try {
                const { data } = await subscribeEmailToNewsletter({
                    variables: { email }
                });

                if (data?.subscribeEmailToNewsletter?.status === 'SUBSCRIBED') {
                    msgBox.textContent = 'Thank you for subscribing!';
                    msgBox.style.color = '#00a651'; // Success green
                    input.value = ''; // clear input
                    btn.textContent = 'Subscribed';
                } else if (data?.subscribeEmailToNewsletter?.status === 'NOT_ACTIVE') {
                    msgBox.textContent = 'Please check your email to confirm subscription.';
                    msgBox.style.color = '#e67e22'; // Warning orange
                    input.value = '';
                    btn.textContent = 'Check Email';
                } else {
                    msgBox.textContent = 'Subscription status: ' + data?.subscribeEmailToNewsletter?.status;
                    msgBox.style.color = '#00a651';
                    input.value = '';
                    btn.textContent = 'Subscribe';
                }
                
                // Reset button text after a few seconds if successful
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = 'Subscribe';
                }, 3000);

            } catch (err) {
                console.error("Newsletter subscription error:", err);
                msgBox.textContent = err.message || 'An error occurred. Please try again.';
                msgBox.style.color = '#ff4d4d';
                btn.disabled = false;
                btn.textContent = 'Subscribe';
            }
        }
    };

    return (
        <footer className="main-footer" style={{ backgroundColor: '#000', color: '#fff', marginTop: '60px' }}>
            {/* Global CMS Footer */}
            {decodedContent ? (
                <div 
                    className="cms-footer-content container"
                    dangerouslySetInnerHTML={{ __html: decodedContent }} 
                    onClick={handleFooterClick}
                />
            ) : (
                <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Footer content configured in Admin is missing or empty.</p>
                </div>
            )}
        </footer>
    );
};

export default Footer;
