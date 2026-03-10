import { gql } from '@apollo/client';

export const SUBSCRIBE_NEWSLETTER = gql`
    mutation SubscribeEmailToNewsletter($email: String!) {
        subscribeEmailToNewsletter(email: $email) {
            status
        }
    }
`;
