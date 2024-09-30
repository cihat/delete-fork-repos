const axios = require('axios');

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const API_URL = 'https://api.github.com';

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

async function getAllRepos(username, token) {
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
      repos = repos.concat(response.data.filter(repo => new Date(repo.updated_at) < oneYearAgo));
      
      url = null;
      if (response.headers.link) {
        const links = response.headers.link.split(',');
        for (const link of links) {
          const [urlPart, relPart] = link.split(';');
          if (relPart.includes('rel="next"')) {
            url = urlPart.trim().slice(1, -1);
            break;
          }
        }
      }
    }
    return repos;
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return [];
  }
}
async function makeRepoPrivate(repoFullName, token) {
  try {
    const url = `${API_URL}/repos/${repoFullName}`;
    const headers = { 'Authorization': `token ${token}` };
    const data = { private: true };
    await axios.patch(url, data, { headers });
    console.log(`Made private: ${repoFullName}`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`Failed to make private: ${repoFullName} - Repository not found (404)`);
    } else {
      console.error(`Failed to make private: ${repoFullName} - ${error.message}`);
    }
  }
}

(async () => {
  const staleRepos = await getAllRepos(GITHUB_USERNAME, GITHUB_TOKEN);
  console.log(`Found ${staleRepos.length} repositories that haven't been updated in over a year.`);
  for (const repo of staleRepos) {
    await makeRepoPrivate(repo.full_name, GITHUB_TOKEN);
  }
})();
