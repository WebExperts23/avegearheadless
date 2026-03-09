import fs from 'fs';

fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    query: `
      query {
        cmsPage(identifier: "contact") {
          identifier
          title
        }
      }
    ` 
  })
})
.then(res => res.json())
.then(res => {
  console.log("Contact? :", res);
})
.catch(err => console.error(err));
