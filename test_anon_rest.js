const searchCriteria = '?searchCriteria[filter_groups][0][filters][0][field]=identifier&searchCriteria[filter_groups][0][filters][0][value]=avgear-footer&searchCriteria[filter_groups][0][filters][0][condition_type]=eq';
  
fetch(`https://2fc1869dd5.nxcli.io/rest/V1/cmsBlock/search${searchCriteria}`)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
