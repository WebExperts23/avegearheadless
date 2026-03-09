const username = "avgearadmin";
const password = "avgearadmins@2026";
const baseUrl = "https://2fc1869dd5.nxcli.io";

async function checkBlock() {
  try {
    const tokenResponse = await fetch(`${baseUrl}/rest/V1/integration/admin/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const token = await tokenResponse.json();

    const searchCriteria = '?searchCriteria[filter_groups][0][filters][0][field]=identifier&searchCriteria[filter_groups][0][filters][0][value]=avgear-footer&searchCriteria[filter_groups][0][filters][0][condition_type]=eq';
    
    const response = await fetch(`${baseUrl}/rest/V1/cmsBlock/search${searchCriteria}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    if(data.items && data.items.length > 0) {
      console.log("---- CONTENT START ----");
      console.log(data.items[0].content);
      console.log("---- CONTENT END ----");
    }
  } catch (error) {
    console.error(error);
  }
}

checkBlock();
