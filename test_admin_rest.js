const username = "avgearadmin";
const password = "avgearadmins@2026";
const baseUrl = "https://2fc1869dd5.nxcli.io";

async function checkPages() {
  try {
    const tokenResponse = await fetch(`${baseUrl}/rest/V1/integration/admin/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const token = await tokenResponse.json();

    if (!tokenResponse.ok) {
        console.error("Failed to get token:", token);
        return;
    }

    const searchCriteria = '?searchCriteria[filter_groups][0][filters][0][field]=identifier&searchCriteria[filter_groups][0][filters][0][value]=%25contact%25&searchCriteria[filter_groups][0][filters][0][condition_type]=like';
    
    const response = await fetch(`${baseUrl}/rest/V1/cmsPage/search${searchCriteria}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    
    if (data.items) {
        console.log(`Found ${data.items.length} pages matching 'contact'.`);
        data.items.forEach(page => {
            console.log(`----------------------------------------`);
            console.log(`ID: ${page.id}`);
            console.log(`Title: ${page.title}`);
            console.log(`Identifier: ${page.identifier}`);
            console.log(`Active: ${page.active}`);
            console.log(`Store ID: ${Array.isArray(page.store_id) ? page.store_id.join(',') : page.store_id}`);
            const contentSnippet = page.content ? page.content.substring(0, 100).replace(/\n/g, ' ') : 'NO CONTENT';
            console.log(`Content Snippet: ${contentSnippet}...`);
        });
    } else {
        console.error(data);
    }
  } catch (error) {
    console.error(error);
  }
}

checkPages();
