const query = `
query {
  cmsPage(identifier: "contact-us") {
    identifier
    title
    content_heading
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
  .then(data => console.log("Default Store:", data.data))
  .catch(err => console.error(err));
