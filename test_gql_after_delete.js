const query = `
query {
  cmsPage(identifier: "contact-us") {
    identifier
    title
    content_heading
    content
  }
}
`;

fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})
  .then(res => res.json())
  .then(data => {
    if (data.errors) {
      console.error(JSON.stringify(data.errors, null, 2));
    } else {
       console.log("Title Returned:", data.data.cmsPage.title);
       console.log("Content returned (first 200 chars):", data.data.cmsPage.content.substring(0, 200));
    }
  })
  .catch(err => console.error(err));
