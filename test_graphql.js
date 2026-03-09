fetch('https://2fc1869dd5.nxcli.io/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __type(name: "Mutation") { fields { name args { name type { name kind ofType { name kind } } } } } }' })
})
.then(res => res.json())
.then(res => {
  const fields = res.data.__type.fields;
  const resetFields = fields.filter(f => f.name.toLowerCase().includes('password'));
  console.log(JSON.stringify(resetFields, null, 2));
});
