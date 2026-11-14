const axios = require('axios');
const GITHUB_API_BASE = 'https://api.github.com';

async function commitFileToGitHub(filePath, fileContent, commitMessage) {
    const githubPat = process.env.GH_PAT;
    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME;
    const branch = process.env.REPO_BRANCH || 'main';

    if (!githubPat || !owner || !repo) {
        throw new Error('GitHub configuration missing.');
    }

    const headers = {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };

    const refResponse = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    const latestCommitSha = refResponse.data.object.sha;

    const commitResponse = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    const baseTreeSha = commitResponse.data.tree.sha;

    const blobResponse = await axios.post(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`, {
        content: Buffer.from(fileContent).toString('base64'),
        encoding: 'base64'
    }, { headers });
    const blobSha = blobResponse.data.sha;

    const treeResponse = await axios.post(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, {
        base_tree: baseTreeSha,
        tree: [{ path: filePath, mode: '100644', type: 'blob', sha: blobSha }]
    }, { headers });
    const newTreeSha = treeResponse.data.sha;

    const newCommitResponse = await axios.post(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, {
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha]
    }, { headers });
    const newCommitSha = newCommitResponse.data.sha;

    await axios.patch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        sha: newCommitSha,
        force: false
    }, { headers });

    return newCommitSha;
}

module.exports = { commitFileToGitHub };
