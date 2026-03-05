// test_price.cjs
const fetch = require('node-fetch');

const query = `
  query {
    products(search: "Universal, Adjustable 57-82cm, Projector Ceiling Mount for Flat or Angled/Cathedral Ceilings") {
      items {
        sku
        name
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
`;

async function getProduct() {
    try {
        const res = await fetch('https://2fc1869dd5.nxcli.io/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (err) {
        console.error(err);
    }
}
getProduct();
