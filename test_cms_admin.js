import fs from 'fs';

async function testAdmin() {
    const username = 'avgearadmin';
    const password = 'avgearadmins@2026';

    console.log("Fetching token...");
    const tokenRes = await fetch('https://2fc1869dd5.nxcli.io/rest/V1/integration/admin/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!tokenRes.ok) {
        console.error("Token fetch failed:", await tokenRes.text());
        return;
    }
    
    const token = await tokenRes.json();
    console.log("Got token.");

    console.log("Fetching CMS page...");
    const res = await fetch('https://2fc1869dd5.nxcli.io/graphql', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // This should bypass Varnish
      },
      body: JSON.stringify({ 
        query: `
          query {
            cmsPage(identifier: "contact-us") {
              identifier
              title
              content
            }
          }
        ` 
      })
    });

    const json = await res.json();
    console.log("Response Title:", json.data?.cmsPage?.title);
    console.log("Response Content Preview:", json.data?.cmsPage?.content?.substring(0, 500));
}

testAdmin();
