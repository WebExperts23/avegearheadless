import { gql } from '@apollo/client';

export const GENERATE_CUSTOMER_TOKEN = gql`
  mutation GenerateCustomerToken($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) {
      token
    }
  }
`;

export const GET_CUSTOMER_DATA = gql`
  query GetCustomerData {
    customer {
      firstname
      lastname
      email
      orders(pageSize: 10) {
        items {
          id
          number
          order_date
          status
          total {
            grand_total {
              value
              currency
            }
          }
        }
      }
      addresses {
        id
        firstname
        lastname
        street
        city
        region {
          region
        }
        postcode
        country_code
        telephone
        default_shipping
        default_billing
      }
    }
  }
`;

export const REVOKE_CUSTOMER_TOKEN = gql`
  mutation RevokeCustomerToken {
    revokeCustomerToken {
      result
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer(
    $firstname: String!,
    $lastname: String!,
    $email: String!,
    $password: String!,
    $is_subscribed: Boolean
  ) {
    createCustomer(
      input: {
        firstname: $firstname
        lastname: $lastname
        email: $email
        password: $password
        is_subscribed: $is_subscribed
      }
    ) {
      customer {
        firstname
        lastname
        email
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET_EMAIL = gql`
  mutation RequestPasswordResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $resetToken: String!, $newPassword: String!) {
    resetPassword(
      email: $email
      resetPasswordToken: $resetToken
      newPassword: $newPassword
    )
  }
`;
