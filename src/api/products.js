import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $pageSize: Int = 8) {
    products(search: $search, pageSize: $pageSize) {
      items {
        uid
        sku
        name
        stock_status
        only_x_left_in_stock
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
        small_image {
          url
        }
      }
    }
  }
`;

export const GET_PRODUCT_DETAIL = gql`
  query GetProductDetail($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        uid
        sku
        name
        stock_status
        only_x_left_in_stock
        description {
          html
        }
        ... on ConfigurableProduct {
          configurable_options {
            id
            attribute_code
            label
            values {
              value_index
              label
              uid
            }
          }
          variants {
            attributes {
              code
              value_index
            }
            product {
              sku
              stock_status
              only_x_left_in_stock
            }
          }
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
        media_gallery {
          url
          label
        }
      }
    }
  }
`;

export const GET_CATEGORY_PRODUCTS = gql`
  query GetCategoryProducts($id: String!, $pageSize: Int = 12, $currentPage: Int = 1, $filter: ProductAttributeFilterInput) {
    products(filter: $filter, pageSize: $pageSize, currentPage: $currentPage) {
      items {
        uid
        sku
        name
        stock_status
        only_x_left_in_stock
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
        small_image {
          url
        }
      }
      aggregations {
        attribute_code
        label
        count
        options {
          label
          value
          count
        }
      }
      total_count
      page_info {
        current_page
        total_pages
      }
    }
    categoryList(filters: { category_uid: { eq: $id } }) {
        name
        description
        children {
            uid
            children {
                uid
                children {
                    uid
                }
            }
        }
    }
  }
`;

export const GET_CATEGORY_TREE = gql`
  query GetCategoryTree {
    categoryList(filters: { ids: { eq: "2" } }) {
      children {
        uid
        name
        include_in_menu
        url_key
        url_path
        children {
          uid
          name
          url_key
          url_path
          include_in_menu
        }
      }
    }
  }
`;

export const GET_STORE_CONFIG = gql`
  query GetStoreConfig {
    storeConfig {
      header_logo_src
      secure_base_media_url
      logo_alt
    }
  }
`;

export const GET_CMS_PAGE = gql`
  query GetCmsPage($identifier: String!) {
    cmsPage(identifier: $identifier) {
      identifier
      title
      content
      content_heading
      meta_title
      meta_description
    }
  }
`;

export const GET_CMS_BLOCKS = gql`
  query GetCmsBlocks($identifiers: [String]!) {
    cmsBlocks(identifiers: $identifiers) {
      items {
        identifier
        title
        content
      }
    }
  }
`;
