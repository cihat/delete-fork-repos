const axios = require('axios');

const GITHUB_USERNAME = '@your-username';
const GITHUB_TOKEN = '@your-token';

const API_URL = 'https://api.github.com';

async function getForkedRepos(username, token) {
  try {
    let url = `${API_URL}/user/repos`;
    const headers = {
      'Authorization': `token ${token}`
    };
    const params = {
      type: 'owner',
      per_page: 100
    };
    let repos = [];
    while (url) {
      const response = await axios.get(url, { headers, params });
      repos = repos.concat(response.data.filter(repo => repo.fork && repo.private === false));
      url = (response.headers.link && response.headers.link.includes('rel="next"')) 
            ? response.headers.link.match(/<(.*?)>; rel="next"/)[1] 
            : null;
    }
    return repos;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }
}

async function deleteRepo(repoFullName, token) {
  try {
    const url = `${API_URL}/repos/${repoFullName}`;
    const headers = {
      'Authorization': `token ${token}`
    };
    await axios.delete(url, { headers });
    console.log(`Deleted: ${repoFullName}`);
  } catch (error) {
    console.error(`Failed to delete: ${repoFullName} - ${error.response.status}`);
  }
}

(async () => {
  const forkedRepos = await getForkedRepos(GITHUB_USERNAME, GITHUB_TOKEN);
  console.log(`Found ${forkedRepos.length} forked repositories.`);
  for (const repo of forkedRepos) {
    await deleteRepo(repo.full_name, GITHUB_TOKEN);
  }
})();
