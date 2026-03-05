// check_specific_product.js
const query = `
  query {
    products(search: "Universal, Adjustable 57-82cm, Projector Ceiling Mount") {
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
            headers: {
                'Content-Type': 'application/json',
                // 'Cache-Control': 'no-cache, no-store, must-revalidate',
                // 'Pragma': 'no-cache',
                // 'Expires': '0'
            },
            body: JSON.stringify({ query })
        });
        const json = await res.json();

        // find the exact product
        const items = json?.data?.products?.items || [];
        const exactMatch = items.find(i => i.name && i.name.includes('Universal, Adjustable 57-82cm, Projector Ceiling Mount for Flat'));

        if (exactMatch) {
            console.log("EXACT MATCH FOUND:");
            console.log(JSON.stringify(exactMatch, null, 2));
        } else {
            console.log("Exact match not found. All items:");
            items.forEach(i => console.log(i.name, i.sku));
        }
    } catch (err) {
        console.error(err);
    }
}
checkPrice();
