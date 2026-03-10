import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { GET_CATEGORY_PRODUCTS, GET_CATEGORY_INFO } from '../api/products';
import ProductCard from '../components/catalog/ProductCard';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import SEO from '../components/common/SEO';

const Category = () => {
    const { id, url_key } = useParams();
    const { setBreadcrumbs } = useBreadcrumbs();
    // Start with just the category filter
    const [activeFilters, setActiveFilters] = useState({});
    const [expandedGroupId, setExpandedGroupId] = useState('category');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState({});
    const [pageSize, setPageSize] = useState(12);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const toggleGroup = (groupId) => {
        setExpandedGroupId(prev => prev === groupId ? null : groupId);
    };

    // Construct the full filter object for GraphQL
    const filterVariables = {
        ...activeFilters
    };

    // 1. Resolve Category Info (slug -> uid)
    const { loading: infoLoading, error: infoError, data: infoData } = useQuery(GET_CATEGORY_INFO, {
        variables: { id, urlKey: url_key },
        fetchPolicy: 'cache-first'
    });

    const category = infoData?.categoryList?.[0];
    const categoryUid = category?.uid;
    const categoryName = category?.name || 'Category';

    // 2. Fetch Products once UID is available
    const { loading: productsLoading, error: productsError, data: productsData } = useQuery(GET_CATEGORY_PRODUCTS, {
        variables: {
            filter: {
                ...filterVariables,
                category_uid: { eq: categoryUid }
            },
            pageSize,
            currentPage,
            sort
        },
        skip: !categoryUid,
        fetchPolicy: 'network-only'
    });

    const products = productsData?.products?.items || [];
    const aggregations = productsData?.products?.aggregations || [];
    const totalCount = productsData?.products?.total_count || 0;
    const totalPages = productsData?.products?.page_info?.total_pages || 1;

    const loading = infoLoading || (productsLoading && !productsData);
    const error = infoError || productsError;

    // Update breadcrumbs when category data is loaded
    useEffect(() => {
        if (category) {
            const crumbs = [];

            // Add parent categories from breadcrumbs
            if (category.breadcrumbs) {
                category.breadcrumbs.forEach(b => {
                    // We need url_key for parent breadcrumbs too if possible, 
                    // but the breadcrumbs array usually only has IDs and names.
                    // For now, use IDs or stay consistent. 
                    // Actually, let's just use the name if we can't get the slug easily for parents.
                    crumbs.push({ label: b.category_name, path: `/category/${b.category_uid}` });
                });
            }

            // Add current category
            crumbs.push({ label: categoryName, path: `/${category.url_key || url_key}.html` });

            setBreadcrumbs(crumbs);
        }
        return () => setBreadcrumbs([]);
    }, [category, categoryName, url_key, setBreadcrumbs]);

    // Reset filters and page when changing category
    useEffect(() => {
        setActiveFilters({});
        setExpandedGroupId('category');
        setCurrentPage(1);
    }, [id]);

    const handleFilterChange = (attributeCode, value) => {
        setCurrentPage(1); // Reset to first page on filter change
        setActiveFilters(prev => {
            const newFilters = { ...prev };

            // Special handling for price ranges (usually come as "0_100" or similar)
            if (attributeCode === 'price') {
                const [from, to] = value.split('_');
                const isSelected = newFilters.price?.from === from && newFilters.price?.to === to;

                if (isSelected) {
                    delete newFilters.price;
                } else {
                    newFilters.price = { from, to };
                }
            } else {
                // Standard 'eq' filter for other attributes (brand, color, etc.)
                if (newFilters[attributeCode]?.eq === value) {
                    delete newFilters[attributeCode];
                } else {
                    newFilters[attributeCode] = { eq: value };
                }
            }
            return newFilters;
        });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) return (
        <div className="category-page">
            <div className="header" style={{ backgroundColor: '#f5f5f5', padding: '40px 0', marginBottom: 'var(--spacing-lg)' }}>
                <div className="container">
                    <div className="skeleton" style={{ width: '250px', height: '2.5rem' }}></div>
                </div>
            </div>
            <div className="container">
                <div className="category-layout">
                    <aside className="filters-sidebar">
                        <div className="skeleton" style={{ width: '100%', height: '30px', marginBottom: '20px' }}></div>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ marginBottom: '30px' }}>
                                <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '15px' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[1, 2, 3, 4].map(j => <div key={j} className="skeleton" style={{ width: '100%', height: '15px' }}></div>)}
                                </div>
                            </div>
                        ))}
                    </aside>
                    <div className="products-content">
                        <div className="skeleton" style={{ width: '150px', height: '1rem', marginBottom: '20px' }}></div>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                    <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', marginBottom: '15px', borderRadius: '8px' }}></div>
                                    <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '10px' }}></div>
                                    <div className="skeleton" style={{ width: '60%', height: '1rem', marginBottom: '15px' }}></div>
                                    <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '4px' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (error) return <div className="container" style={{ padding: '40px 0' }}>Error: {error.message}</div>;

    // products and aggregations are now extracted from category.products above

    // We filter out 'category_uid' aggregation usually as it's redundant here, 
    // but useful for subcategories. Let's keep distinct ones.
    const visibleAggregations = aggregations.filter(agg => agg.attribute_code !== 'category_uid' && agg.options?.length > 0);

    return (
        <div className="category-page">
            <SEO
                title={`${categoryName} | AV GEAR`}
                description={category?.meta_description || `Browse our collection of ${categoryName}.`}
                ogType="website"
            />
            <div className="header" style={{ backgroundColor: '#f5f5f5', padding: '40px 0', marginBottom: 'var(--spacing-lg)' }}>
                <div className="container">
                    <h1 style={{ margin: 0, fontWeight: 300 }}>{categoryName}</h1>
                </div>
            </div>

            <div className="container">
                {/* Mobile Filter Toggle */}
                <div className="mobile-filter-toggle">
                    <button onClick={() => setIsFilterOpen(true)} className="btn primary" style={{ width: '100%', marginBottom: '20px' }}>
                        Filter & Sort
                    </button>
                </div>

                <div className="category-layout">

                    {/* Sidebar Filters */}
                    <aside className={`filters-sidebar ${isFilterOpen ? 'open' : ''}`}>
                        <div className="filter-header-mobile">
                            <h2 className="sidebar-shop-by">Shop By</h2>
                            <button className="close-filter-btn" onClick={() => setIsFilterOpen(false)}>&times;</button>
                        </div>

                        {/* Category Block (Always shown as active in SS) */}
                        <div className={`filter-block ${expandedGroupId === 'category' ? 'active' : ''}`}>
                            <div className="filter-block-title" onClick={() => toggleGroup('category')}>
                                Category <span>{expandedGroupId === 'category' ? '−' : '+'}</span>
                            </div>
                            {expandedGroupId === 'category' && (
                                <div className="filter-item-list">
                                    <div className="filter-item selected">
                                        <span>{categoryName}</span>
                                        <span className="count">({totalCount})</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {visibleAggregations.map(agg => {
                            const isExpanded = expandedGroupId === agg.attribute_code;
                            return (
                                <div key={agg.attribute_code} className={`filter-block ${isExpanded ? 'active' : ''}`}>
                                    <div className="filter-block-title" onClick={() => toggleGroup(agg.attribute_code)}>
                                        {agg.label} <span>{isExpanded ? '−' : '+'}</span>
                                    </div>
                                    {isExpanded && (
                                        <div className="filter-item-list">
                                            {agg.options.map(option => {
                                                let isSelected = false;
                                                if (agg.attribute_code === 'price') {
                                                    const [f, t] = option.value.split('_');
                                                    isSelected = activeFilters.price?.from === f && activeFilters.price?.to === t;
                                                } else {
                                                    isSelected = activeFilters[agg.attribute_code]?.eq === option.value;
                                                }

                                                return (
                                                    <div
                                                        key={option.value}
                                                        className={`filter-item ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => handleFilterChange(agg.attribute_code, option.value)}
                                                    >
                                                        <span>{option.label}</span>
                                                        <span className="count">({option.count})</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {visibleAggregations.length === 0 && (
                            <p style={{ color: '#999', fontSize: '0.8rem', padding: '15px' }}>No additional filters available.</p>
                        )}
                    </aside>

                    {/* Product Grid */}
                    <div className="products-content">
                        {products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
                                <p>No products match your selected filters.</p>
                                <button
                                    onClick={() => setActiveFilters({})}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="category-controls">
                                    <div className="category-counts-sort">
                                        <span>{totalCount} products found</span>

                                        <select
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCurrentPage(1);
                                                if (val === 'price_asc') setSort({ price: 'ASC' });
                                                else if (val === 'price_desc') setSort({ price: 'DESC' });
                                                else setSort({});
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                background: '#fff'
                                            }}
                                            value={sort.price === 'ASC' ? 'price_asc' : (sort.price === 'DESC' ? 'price_desc' : '')}
                                        >
                                            <option value="">Sort By: Relevance</option>
                                            <option value="price_asc">Price: Low to High</option>
                                            <option value="price_desc">Price: High to Low</option>
                                        </select>

                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(parseInt(e.target.value));
                                                setCurrentPage(1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                background: '#fff'
                                            }}
                                        >
                                            <option value="12">Show: 12</option>
                                            <option value="24">Show: 24</option>
                                            <option value="36">Show: 36</option>
                                        </select>
                                    </div>
                                    <div className="category-view-toggles">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            style={{
                                                background: viewMode === 'grid' ? '#333' : '#fff',
                                                color: viewMode === 'grid' ? '#fff' : '#333',
                                                border: '1px solid #ddd',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Grid View"
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            style={{
                                                background: viewMode === 'list' ? '#333' : '#fff',
                                                color: viewMode === 'list' ? '#fff' : '#333',
                                                border: '1px solid #ddd',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="List View"
                                        >
                                            <ListIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className={viewMode === 'grid' ? 'grid' : 'list-view'}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr',
                                        gap: '25px',
                                        marginBottom: '60px'
                                    }}
                                >
                                    {products.map(product => (
                                        <ProductCard key={product.uid} product={product} viewMode={viewMode} />
                                    ))}
                                </div>

                                {/* Pagination UI */}
                                {totalPages > 1 && (
                                    <div className="pagination" style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '40px 0',
                                        borderTop: '1px solid #eee'
                                    }}>
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '30px',
                                                border: '1px solid #ddd',
                                                background: '#fff',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                opacity: currentPage === 1 ? 0.5 : 1,
                                                fontSize: '0.9rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            Previous
                                        </button>

                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {[...Array(totalPages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                // Show first, last, current, and pages around current
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '50%',
                                                                border: '1px solid',
                                                                borderColor: currentPage === pageNum ? 'var(--primary-color)' : '#ddd',
                                                                background: currentPage === pageNum ? 'var(--primary-color)' : '#fff',
                                                                color: currentPage === pageNum ? '#fff' : '#333',
                                                                cursor: 'pointer',
                                                                fontWeight: 600,
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} style={{ alignSelf: 'center', color: '#999' }}>...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '30px',
                                                border: '1px solid #ddd',
                                                background: '#fff',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                opacity: currentPage === totalPages ? 0.5 : 1,
                                                fontSize: '0.9rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Category;
