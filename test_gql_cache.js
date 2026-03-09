const query = `
query GetCmsPage {
  cmsPage(identifier: "contact-us") {
    identifier
    title
    content_heading
    content
  }
}
`;

// Test 1: Standard request
fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})
  .then(res => res.json())
  .then(data => console.log("Standard Request Title:", data.data?.cmsPage?.title))
  .catch(err => console.error("Standard Request Error:", err));

// Test 2: Cache busting headers + Store header
fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Store': 'default', // Try default store view explicitly
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  body: JSON.stringify({ query }),
})
  .then(res => res.json())
  .then(data => console.log("Cache-Busting Explicit Store Request Title:", data.data?.cmsPage?.title))
  .catch(err => console.error("Cache-Busting Error:", err));
