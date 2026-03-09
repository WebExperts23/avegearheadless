import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useLazyQuery, useApolloClient } from '@apollo/client';
import { GENERATE_CUSTOMER_TOKEN, GET_CUSTOMER_DATA, REVOKE_CUSTOMER_TOKEN, CREATE_CUSTOMER, REQUEST_PASSWORD_RESET_EMAIL, RESET_PASSWORD } from '../api/customer';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const client = useApolloClient();

    const [getCustomerData, { data: customerData }] = useLazyQuery(GET_CUSTOMER_DATA, {
        fetchPolicy: 'network-only'
    });

    const [generateToken] = useMutation(GENERATE_CUSTOMER_TOKEN);
    const [revokeToken] = useMutation(REVOKE_CUSTOMER_TOKEN);
    const [createCustomer] = useMutation(CREATE_CUSTOMER);
    const [requestPasswordResetEmail] = useMutation(REQUEST_PASSWORD_RESET_EMAIL);
    const [resetPasswordMutation] = useMutation(RESET_PASSWORD);

    // Load user on mount if token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, []);

    // Update user state when customer data is fetched
    useEffect(() => {
        if (customerData?.customer) {
            setUser(customerData.customer);
            setLoading(false);
        }
    }, [customerData]);

    const fetchUserData = async () => {
        try {
            await getCustomerData();
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            logout();
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await generateToken({ variables: { email, password } });
            const token = data.generateCustomerToken.token;
            localStorage.setItem('token', token);

            // Clear cache and fetch fresh data
            await client.clearStore();
            await fetchUserData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (input) => {
        try {
            await createCustomer({ variables: input });
            // Auto login after registration
            return await login(input.email, input.password);
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await revokeToken();
        } catch (e) {
            // Even if revocation fails on server, we clear local state
        }
        localStorage.removeItem('token');
        localStorage.removeItem('cart_id');
        setUser(null);
        await client.clearStore();
    };

    const requestPasswordReset = async (email) => {
        try {
            await requestPasswordResetEmail({ variables: { email } });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const resetCustomerPassword = async (email, resetToken, newPassword) => {
        try {
            await resetPasswordMutation({
                variables: {
                    email,
                    resetToken,
                    newPassword
                }
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser: fetchUserData, requestPasswordReset, resetCustomerPassword }}>
            {children}
        </AuthContext.Provider>
    );
};
