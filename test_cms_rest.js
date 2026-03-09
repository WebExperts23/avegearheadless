import fs from 'fs';

async function fetchAllPages() {
    const username = 'avgearadmin';
    const password = 'avgearadmins@2026';

    const tokenRes = await fetch('https://2fc1869dd5.nxcli.io/rest/V1/integration/admin/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const token = await tokenRes.json();

    const res = await fetch('https://2fc1869dd5.nxcli.io/rest/V1/cmsPage/search?searchCriteria[current_page]=1&searchCriteria[page_size]=100', {
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });

    const json = await res.json();
    
    // Just map to identifier and title
    const pages = json.items.map(p => ({
        id: p.id,
        identifier: p.identifier,
        title: p.title,
        contentPreview: p.content.substring(0, 100).replace(/\n/g, '')
    }));

    fs.writeFileSync('all_cms_pages.json', JSON.stringify(pages, null, 2));
    console.log("Wrote all pages to all_cms_pages.json");
}

fetchAllPages();
