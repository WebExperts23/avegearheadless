fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: `
      query {
        cmsPage(identifier: "contact-us") {
          identifier
          title
          content
        }
        cmsPage2: cmsPage(identifier: "contact") {
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
  console.log(JSON.stringify(res.data, null, 2));
});
