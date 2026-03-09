const query = `
query {
  cmsPages(search: "", pageSize: 50) {
    items {
      identifier
      title
      store_id
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
  .then(data => {
    if (data.errors) {
      console.error(JSON.stringify(data.errors, null, 2));
    } else {
      console.log(JSON.stringify(data.data, null, 2));
    }
  })
  .catch(err => console.error(err));
