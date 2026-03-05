// check_all_prices.js
const query = `
  query {
    products(search: "Universal, Adjustable") {
      items {
        sku
        name
        special_price
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

async function checkPrice() {
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
checkPrice();
