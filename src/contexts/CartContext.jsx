import React, { createContext, useContext, useState, useEffect } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { getSalableQty } from '../api/stock';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Queries/Mutations for Cart
const CREATE_CART = gql`
    mutation CreateCart {
        createEmptyCart
    }
`;

const GET_CUSTOMER_CART = gql`
    query GetCustomerCart {
        customerCart {
            id
        }
    }
`;

const MERGE_CARTS = gql`
    mutation MergeCarts($sourceId: String!, $destId: String!) {
        mergeCarts(source_cart_id: $sourceId, destination_cart_id: $destId) {
            id
            items {
                uid
                quantity
            }
        }
    }
`;

const GET_CART = gql`
    query GetCart($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            total_quantity
            applied_coupons {
                code
            }
            prices {
                grand_total {
                    value
                    currency
                }
                subtotal_excluding_tax {
                    value
                    currency
                }
                discounts {
                    amount {
                        value
                        currency
                    }
                    label
                }
            }
            items {
                uid
                quantity
                product {
                    name
                    sku
                    thumbnail {
                        url
                    }
                    small_image {
                        url
                    }
                    media_gallery {
                        url
                    }
                    price_range {
                        minimum_price {
                            regular_price {
                                value
                                currency
                            }
                            final_price {
                                value
                                currency
                            }
                        }
                    }
                }
            }
        }
    }
`;

const ADD_TO_CART = gql`
    mutation AddToCart($cartId: String!, $cartItems: [CartItemInput!]!) {
        addProductsToCart(cartId: $cartId, cartItems: $cartItems) {
            cart {
                id
                total_quantity
            }
        }
    }
`;

const UPDATE_CART_ITEMS = gql`
    mutation UpdateCartItems($cartId: String!, $cartItemInput: [CartItemUpdateInput!]!) {
        updateCartItems(input: { cart_id: $cartId, cart_items: $cartItemInput }) {
            cart {
                id
                total_quantity
            }
        }
    }
`;

const REMOVE_FROM_CART = gql`
    mutation RemoveItem($cartId: String!, $itemId: ID!) {
        removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $itemId }) {
            cart {
                id
                total_quantity
            }
        }
    }
`;

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartId, setCartId] = useState(() => {
        const saved = localStorage.getItem('cart_id');
        if (saved && saved !== 'undefined' && saved !== 'null' && saved.trim() !== '') {
            return saved;
        }
        return null;
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [createCartMutation] = useMutation(CREATE_CART);
    const [addToCartMutation] = useMutation(ADD_TO_CART);
    const [updateCartItemsMutation] = useMutation(UPDATE_CART_ITEMS);
    const [removeItemMutation] = useMutation(REMOVE_FROM_CART);
    const [mergeCartsMutation] = useMutation(MERGE_CARTS);

    // Fetch customer cart ID if logged in
    const { data: customerCartData } = useQuery(GET_CUSTOMER_CART, {
        skip: !user,
        fetchPolicy: 'network-only'
    });

    // Fetch cart data from Magento
    const { data: cartData, refetch: refetchCart } = useQuery(GET_CART, {
        variables: { cartId: cartId || '' },
        skip: !cartId,
        notifyOnNetworkStatusChange: true
    });

    const cartItems = cartData?.cart?.items?.map(item => ({
        id: item.uid,
        product: item.product,
        quantity: item.quantity
    })) || [];

    const cartTotals = cartData?.cart?.prices || {
        grand_total: { value: 0, currency: 'USD' },
        subtotal_excluding_tax: { value: 0, currency: 'USD' },
        discounts: []
    };
    const totalQuantity = cartData?.cart?.total_quantity || 0;
    const appliedCoupons = cartData?.cart?.applied_coupons || [];

    // Cookie Bridging for Magento Luma
    useEffect(() => {
        if (cartId) {
            // Set 'cart' cookie that Magento Luma expects for guest carts
            // Path=/ ensures it is available on all proxied routes like /checkout
            document.cookie = `cart=${cartId}; path=/; max-age=31536000; SameSite=Lax`;
            console.log(`[CookieBridge] Syncing cart cookie: ${cartId}`);
        }
    }, [cartId]);

    // Initialize Cart
    useEffect(() => {
        const initCart = async () => {
            if (!cartId && !user) {
                try {
                    const res = await createCartMutation();
                    const id = res.data.createEmptyCart;
                    if (id) {
                        setCartId(id);
                        localStorage.setItem('cart_id', id);
                    }
                } catch (err) {
                    console.error("Failed to create guest cart", err);
                }
            }
        };
        initCart();
    }, [cartId, createCartMutation, user]);

    // Handle Login merge
    useEffect(() => {
        const handleMerge = async () => {
            if (user && customerCartData?.customerCart?.id) {
                const customerCartId = customerCartData.customerCart.id;
                
                // If we have a guest cart that isn't the customer cart, merge them
                if (cartId && cartId !== customerCartId) {
                    try {
                        console.log(`Merging guest cart ${cartId} into customer cart ${customerCartId}`);
                        await mergeCartsMutation({
                            variables: { sourceId: cartId, destId: customerCartId }
                        });
                    } catch (err) {
                        console.error("Failed to merge carts:", err);
                    }
                }

                if (cartId !== customerCartId) {
                    setCartId(customerCartId);
                    localStorage.setItem('cart_id', customerCartId);
                    refetchCart();
                }
            }
        };
        handleMerge();
    }, [user, customerCartData, cartId, mergeCartsMutation, refetchCart]);

    const addToCart = async (product, quantity = 1, selectedOptions = {}) => {
        if (!cartId || !product?.sku) return;
        setLoading(true);
        try {
            const cartItemInput = {
                sku: product.sku,
                quantity: parseFloat(quantity)
            };

            // Handle configurable options if present
            if (Object.keys(selectedOptions).length > 0 && product.configurable_options) {
                const optionUids = [];
                product.configurable_options.forEach(opt => {
                    const selectedValIndex = selectedOptions[opt.attribute_code];
                    if (selectedValIndex !== undefined) {
                        const val = opt.values.find(v => v.value_index === selectedValIndex);
                        if (val) optionUids.push(val.uid);
                    }
                });
                if (optionUids.length > 0) {
                    cartItemInput.selected_options = optionUids;
                }
            }

            await addToCartMutation({
                variables: { cartId, cartItems: [cartItemInput] }
            });
            await refetchCart();
            setIsCartOpen(true);
        } catch (err) {
            console.error('Error adding to cart:', err);
            window.alert(err.message || 'Failed to add to cart');
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (itemId) => {
        if (!cartId) return;
        setLoading(true);
        try {
            await removeItemMutation({
                variables: { cartId, itemId }
            });
            await refetchCart();
        } catch (err) {
            console.error('Error removing from cart:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (!cartId || quantity < 1) return;
        setLoading(true);
        try {
            await updateCartItemsMutation({
                variables: {
                    cartId,
                    cartItemInput: [{ cart_item_uid: itemId, quantity: parseFloat(quantity) }]
                }
            });
            await refetchCart();
        } catch (err) {
            console.error('Error updating quantity:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearCart = () => {
        setCartId(null);
        localStorage.removeItem('cart_id');
    };

    const syncSession = async () => {
        try {
            // Poke Magento sections to warm up the session and ensure cookies are established
            // We fetch the cart, checkout-data, and customer sections specifically
            const response = await fetch('/customer/section/load?sections=cart,checkout-data,customer', {
                headers: { 
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                }
            });
            const data = await response.json();
            console.log('[SessionSync] Magento session sections "warmed up":', Object.keys(data));
            
            // If Magento returned a new form_key, it will be in the cookies handled by the proxy
        } catch (err) {
            console.error('[SessionSync] Failed to sync session:', err);
        }
    };

    return (
        <CartContext.Provider value={{
            cartId,
            cartItems,
            cartTotals,
            totalQuantity,
            appliedCoupons,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            loading,
            refetchCart,
            syncSession
        }}>
            {loading && <LoadingOverlay />}
            {children}
        </CartContext.Provider>
    );
};
