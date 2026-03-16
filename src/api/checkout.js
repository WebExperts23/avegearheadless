import { gql } from '@apollo/client';

export const SET_GUEST_EMAIL = gql`
  mutation SetGuestEmail($cartId: String!, $email: String!) {
    setGuestEmailOnCart(input: { cart_id: $cartId, email: $email }) {
      cart {
        id
      }
    }
  }
`;

export const SET_SHIPPING_ADDRESS = gql`
  mutation SetShippingAddress($cartId: String!, $address: ShippingAddressInput!) {
    setShippingAddressesOnCart(
      input: {
        cart_id: $cartId
        shipping_addresses: [$address]
      }
    ) {
      cart {
        id
        shipping_addresses {
          firstname
          lastname
          street
          city
          region {
            code
            label
          }
          postcode
          telephone
          country {
            code
            label
          }
          available_shipping_methods {
            carrier_code
            carrier_title
            method_code
            method_title
            amount {
              value
              currency
            }
          }
        }
      }
    }
  }
`;

export const SET_BILLING_ADDRESS = gql`
  mutation SetBillingAddress($cartId: String!, $address: BillingAddressInput!) {
    setBillingAddressOnCart(
      input: {
        cart_id: $cartId
        billing_address: $address
      }
    ) {
      cart {
        id
        billing_address {
          firstname
          lastname
          street
          city
          postcode
          telephone
          country {
            code
          }
        }
      }
    }
  }
`;

export const SET_SHIPPING_METHOD = gql`
  mutation SetShippingMethod($cartId: String!, $method: ShippingMethodInput!) {
    setShippingMethodsOnCart(
      input: {
        cart_id: $cartId
        shipping_methods: [$method]
      }
    ) {
      cart {
        id
        selected_shipping_method {
          carrier_code
          method_code
          amount {
            value
            currency
          }
        }
        prices {
          grand_total {
            value
            currency
          }
        }
      }
    }
  }
`;

export const SET_PAYMENT_METHOD = gql`
  mutation SetPaymentMethod($cartId: String!, $paymentMethod: PaymentMethodInput!) {
    setPaymentMethodOnCart(
      input: {
        cart_id: $cartId
        payment_method: $paymentMethod
      }
    ) {
      cart {
        id
        selected_payment_method {
          code
          title
        }
      }
    }
  }
`;

export const PLACE_ORDER = gql`
  mutation PlaceOrder($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      order {
        order_number
      }
    }
  }
`;

// Query to get available addresses/methods if already set
export const GET_CHECKOUT_DETAILS = gql`
  query GetCheckoutDetails($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      email
      is_virtual
      total_quantity
      shipping_addresses {
        firstname
        lastname
        street
        city
        region {
          code
          label
        }
        postcode
        telephone
        country {
          code
          label
        }
        selected_shipping_method {
          carrier_code
          method_code
          carrier_title
          method_title
          amount {
            value
            currency
          }
        }
        available_shipping_methods {
          carrier_code
          carrier_title
          method_code
          method_title
          amount {
            value
            currency
          }
        }
      }
      billing_address {
        firstname
        lastname
        street
        city
        postcode
        telephone
        country {
          code
        }
      }
      selected_payment_method {
        code
        title
      }
      available_payment_methods {
        code
        title
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
          }
          label
        }
      }
    }
  }
`;
