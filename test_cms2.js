import fs from 'fs';

fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Store': 'default', // try passing a store header
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
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
})
.then(res => res.json())
.then(res => {
  fs.writeFileSync('cms_debug.json', JSON.stringify(res, null, 2));
  console.log("Written response to cms_debug.json");
  console.log("Title:", res.data?.cmsPage?.title);
  console.log("Content preview:", res.data?.cmsPage?.content?.substring(0, 500));
})
.catch(err => console.error(err));
