import React, { createContext, useContext, useState, useEffect } from 'react';

import { gql, useMutation, useQuery } from '@apollo/client';
import { getSalableQty } from '../api/stock';
import LoadingOverlay from '../components/common/LoadingOverlay';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Queries/Mutations for Cart
const CREATE_CART = gql`
    mutation CreateCart {
        createEmptyCart
    }
`;

const GET_CART = gql`
    query GetCart($cartId: String!) {
        cart(cart_id: $cartId) {
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
                items {
                    uid
                    quantity
                    product {
                        sku
                    }
                }
            }
        }
    }
`;

const REMOVE_FROM_CART = gql`
    mutation RemoveItem($cartId: String!, $itemId: ID!) {
        removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $itemId }) {
            cart {
                items {
                    uid
                }
            }
        }
    }
`;

export const CartProvider = ({ children }) => {
    const [cartId, setCartId] = useState(() => {
        const saved = localStorage.getItem('cart_id');
        // Guard against literal "undefined" string often caused by bad saves
        return (saved && saved !== 'undefined') ? saved : null;
    });
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [createCartMutation] = useMutation(CREATE_CART);
    const [addToCartMutation] = useMutation(ADD_TO_CART);
    const [removeItemMutation] = useMutation(REMOVE_FROM_CART);

    // Fetch cart data
    const { data: cartData, refetch: refetchCart } = useQuery(GET_CART, {
        variables: { cartId: (cartId && cartId !== 'undefined') ? cartId : '' },
        skip: !cartId || cartId === 'undefined',
        notifyOnNetworkStatusChange: true, // Important for showing loading states
    });

    // Update cartItems whenever cartData changes
    useEffect(() => {
        if (cartData?.cart?.items) {
            console.log('Cart Items Updated from Server:', cartData.cart.items);
            setCartItems(cartData.cart.items.map(item => ({
                id: item.uid,
                product: item.product,
                quantity: item.quantity
            })));
        } else if (cartData?.cart === null && cartId && !loading) {
            // Only clear cart ID if we are sure it's invalid and not just loading
            // Prevent silent "cart empty" bug during transient errors
            console.warn('Cart ID might be invalid on server. checking...');
        }
    }, [cartData, cartId, loading]);

    // Initial Cart Creation
    useEffect(() => {
        const initCart = async () => {
            if (!cartId || cartId === 'undefined') {
                try {
                    const res = await createCartMutation();
                    const id = res.data.createEmptyCart;
                    console.log('New Cart Created:', id);
                    if (id) {
                        setCartId(id);
                        localStorage.setItem('cart_id', id);
                    }
                } catch (err) {
                    console.error("Failed to create cart", err);
                }
            }
        };
        initCart();
    }, [cartId, createCartMutation]);

    const addToCart = async (product, quantity = 1, selectedOptions = {}) => {
        console.log('addToCart called with:', { sku: product?.sku, qty: quantity, cartId, selectedOptions });

        if (!cartId || cartId === 'undefined' || !product?.sku) {
            console.error('Missing valid cartId or product SKU', { cartId, sku: product?.sku });
            return;
        }
        setLoading(true);
        try {
            const parentSku = product.sku;

            // Determine SKU for stock validation (variant SKU if options selected)
            let validationSku = parentSku;
            if (Object.keys(selectedOptions).length > 0 && product.variants) {
                const variant = product.variants.find(v =>
                    v.attributes.every(attr => selectedOptions[attr.code] === attr.value_index)
                );
                if (variant) {
                    validationSku = variant.product.sku;
                    console.log(`[CartDebug] Using variant SKU for validation: ${validationSku}`);
                }
            }

            // Check stock first
            const maxQtyFromApi = await getSalableQty(validationSku);
            const maxQty = (maxQtyFromApi === null || maxQtyFromApi === undefined) ? product.only_x_left_in_stock : maxQtyFromApi;

            const existingQty = cartItems
                .filter(item => item.product.sku === validationSku)
                .reduce((acc, item) => acc + item.quantity, 0);

            console.log(`[CartDebug] Adding ${validationSku}: request=${quantity}, current=${existingQty}, limit=${maxQty}`);

            if (maxQty !== null && maxQty !== undefined && (existingQty + quantity) > maxQty) {
                // Exact message as requested by user
                window.alert(`Only ${maxQty} item available in stock`);
                setLoading(false);
                return;
            } else if (maxQty === null || maxQty === undefined) {
                console.warn(`[CartDebug] No stock limit found for ${validationSku}. Proceeding with add.`);
            }

            // Prepare cart item input
            const cartItemInput = {
                sku: parentSku,
                quantity: parseFloat(quantity)
            };

            // Add selected options if configurable
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

            console.log('Sending addProductsToCart mutation with payload:', cartItemInput);
            const result = await addToCartMutation({
                variables: {
                    cartId,
                    cartItems: [cartItemInput]
                }
            });
            console.log('Mutation Result:', result);

            await refetchCart();
            setIsCartOpen(true);
        } catch (err) {
            console.error('Error adding to cart:', err);
            let errorMessage = 'Failed to add product to cart. Please try again.';

            if (err.graphQLErrors && err.graphQLErrors.length > 0) {
                // If Magento returns a specific stock error, use its message
                errorMessage = err.graphQLErrors[0].message;
                err.graphQLErrors.forEach(({ message, path }) =>
                    console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`)
                );
            } else if (err.networkError) {
                console.error(`[Network error]: ${err.networkError}`);
            }

            window.alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (itemId) => {
        if (!cartId) return;
        try {
            await removeItemMutation({
                variables: { cartId, itemId }
            });
            await refetchCart();
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    const clearCart = () => {
        // Since we are using Magento Cart ID as master, 
        // true "clear" would involve multiple remove mutations or creating a new cart.
        // For simple demo, we just reset local state and cart ID.
        setCartId(null);
        localStorage.removeItem('cart_id');
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{
            cartId,
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            loading
        }}>
            {loading && <LoadingOverlay />}
            {children}
        </CartContext.Provider>
    );
};
