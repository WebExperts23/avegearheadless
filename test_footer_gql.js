const query = `
query GetCmsBlocks {
  cmsBlocks(identifiers: ["avgear-footer"]) {
    items {
      identifier
      title
      content
    }
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
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
