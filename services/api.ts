import { User, Repository, FileTreeItem } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// --- Real GitHub API Functions ---

const makeGithubRequest = async (endpoint: string, token: string, options: RequestInit = {}, parseAsJson: boolean = true) => {
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...(options.body && { 'Content-Type': 'application/json' }),
    },
  });
  if (!response.ok) {
    if (response.status === 409) {
        throw new Error(`Conflicto (409): El archivo fue modificado. Por favor, refresca e inténtalo de nuevo.`);
    }
    try {
        const errorBody = await response.json();
        console.error("GitHub API Error:", response.status, errorBody);
        const message = typeof errorBody.message === 'string' ? errorBody.message : JSON.stringify(errorBody);
        throw new Error(message || `Error de la API de GitHub: ${response.status} ${response.statusText}`);
    } catch (e) {
        // This catch is for when response.json() fails (e.g., empty response body)
        throw new Error(`Error de la API de GitHub: ${response.status} ${response.statusText}`);
    }
  }
  if (response.status === 204 || !parseAsJson) return null;
  return response.json();
};


const getRepoFileTree = async (owner: string, repo: string, branch: string, token: string): Promise<FileTreeItem[]> => {
    try {
        const data = await makeGithubRequest(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token);
        if (data && data.tree) {
            return data.tree.map((item: any) => ({
                path: item.path,
                type: item.type === 'blob' ? 'blob' : 'tree',
                sha: item.sha,
            }));
        }
        return [];
    } catch (error) {
        console.error("Could not fetch repo file tree:", error);
        return [{ path: 'README.md', type: 'blob', sha: '' }]; // Fallback
    }
}

export const api = {
  connectWithGithub: async (token: string): Promise<User> => {
    const data = await makeGithubRequest('/user', token);
    return {
      id: data.login, // Using login as ID
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
    };
  },

  fetchRepositories: async (token: string): Promise<Repository[]> => {
    const data = await makeGithubRequest('/user/repos?sort=updated&per_page=10', token);
    const reposWithFileTree = await Promise.all(
        data.map(async (repo: any) => {
            const fileTree = await getRepoFileTree(repo.owner.login, repo.name, repo.default_branch, token);
            return {
              id: repo.id.toString(),
              name: repo.name,
              owner: { login: repo.owner.login },
              description: repo.description,
              private: repo.private,
              updatedAt: repo.updated_at,
              language: repo.language,
              defaultBranch: repo.default_branch,
              fileTree: fileTree,
            };
        })
    );
    return reposWithFileTree;
  },

  fetchSingleRepository: async (token: string, owner: string, repoName: string): Promise<Repository> => {
    const repo = await makeGithubRequest(`/repos/${owner}/${repoName}`, token);
    const fileTree = await getRepoFileTree(repo.owner.login, repo.name, repo.default_branch, token);
    return {
      id: repo.id.toString(),
      name: repo.name,
      owner: { login: repo.owner.login },
      description: repo.description,
      private: repo.private,
      updatedAt: repo.updated_at,
      language: repo.language,
      defaultBranch: repo.default_branch,
      fileTree: fileTree,
    };
  },
  
  getFileContent: async (token: string, owner: string, repoName: string, fileName: string): Promise<{ content: string, sha: string }> => {
    const data = await makeGithubRequest(`/repos/${owner}/${repoName}/contents/${fileName}`, token);
    let content = '';
    if (data.encoding === 'base64' && data.content) {
        try {
            // First, decode from Base64
            const decodedFromBase64 = atob(data.content);
            // Then, try to decode URI components. This might fail for binary files.
            content = decodeURIComponent(escape(decodedFromBase64));
        } catch (e) {
            console.warn(`Could not decode URI component for ${fileName}. Falling back to raw Base64 decode.`, e);
             // Fallback to just the Base64 decoded string if URI decoding fails
            content = atob(data.content);
        }
    } else {
        content = data.content;
    }

    return { content, sha: data.sha };
  },

  updateFileContent: async (token: string, owner: string, repoName: string, fileName: string, newContent: string, sha: string, commitMessage: string): Promise<{ newSha: string }> => {
    const encodedContent = btoa(unescape(encodeURIComponent(newContent)));
    
    const response = await makeGithubRequest(`/repos/${owner}/${repoName}/contents/${fileName}`, token, {
        method: 'PUT',
        body: JSON.stringify({
            message: commitMessage,
            content: encodedContent,
            sha: sha,
        }),
    });
    
    if (!response || !response.content || !response.content.sha) {
        throw new Error("Invalid response from GitHub API after commit.");
    }
    
    return { newSha: response.content.sha };
  },

  commitConfigurationFile: async (token: string, owner: string, repoName: string, filePath: string, fileContent: string, commitMessage: string): Promise<void> => {
    let sha: string | undefined = undefined;
    try {
        const existingFile = await makeGithubRequest(`/repos/${owner}/${repoName}/contents/${filePath}`, token);
        if (existingFile) {
            sha = existingFile.sha;
        }
    } catch (error) {
        // File doesn't exist, which is fine. We'll create it.
    }
    
    const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

    await makeGithubRequest(`/repos/${owner}/${repoName}/contents/${filePath}`, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: commitMessage,
        content: encodedContent,
        sha: sha, // Include SHA if updating, otherwise it's undefined for creation
      }),
    }, false); // Don't parse JSON for 201/200 responses with no body
  },

  forkRepository: async (token: string, owner: string, repo: string): Promise<Repository> => {
    const forkInitiationResponse = await makeGithubRequest(`/repos/${owner}/${repo}/forks`, token, {
      method: 'POST',
    });
    
    let forkedRepo: any = null;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 3000;
    const user = await makeGithubRequest('/user', token);

    while (attempts < maxAttempts) {
        try {
            forkedRepo = await makeGithubRequest(`/repos/${user.login}/${repo}`, token);
            break;
        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error("El repositorio bifurcado no está disponible después de varios intentos.");
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    const fileTree = await getRepoFileTree(forkedRepo.owner.login, forkedRepo.name, forkedRepo.default_branch, token);

    return {
      id: forkedRepo.id.toString(),
      name: forkedRepo.name,
      owner: { login: forkedRepo.owner.login },
      description: forkedRepo.description,
      private: forkedRepo.private,
      updatedAt: forkedRepo.updated_at,
      language: forkedRepo.language,
      defaultBranch: forkedRepo.default_branch,
      fileTree: fileTree,
    };
  },

  createRepository: async (token: string, name: string, description: string, isPrivate: boolean): Promise<Repository> => {
    const newRepoData = await makeGithubRequest('/user/repos', token, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true, // Auto-initialize with a README
      }),
    });
    
    // Give GitHub a moment to fully create the repo
    await new Promise(resolve => setTimeout(resolve, 2000));

    const repoDetails = await makeGithubRequest(`/repos/${newRepoData.owner.login}/${newRepoData.name}`, token);
    const fileTree = await getRepoFileTree(repoDetails.owner.login, repoDetails.name, repoDetails.default_branch, token);

    return {
      id: repoDetails.id.toString(),
      name: repoDetails.name,
      owner: { login: repoDetails.owner.login },
      description: repoDetails.description,
      private: repoDetails.private,
      updatedAt: repoDetails.updated_at,
      language: repoDetails.language,
      defaultBranch: repoDetails.default_branch,
      fileTree: fileTree,
    };
  },

  createFile: async (token: string, owner: string, repoName: string, filePath: string, commitMessage: string): Promise<{ newSha: string }> => {
    const encodedContent = btoa(unescape(encodeURIComponent('// New file content')));
    
    const response = await makeGithubRequest(`/repos/${owner}/${repoName}/contents/${filePath}`, token, {
        method: 'PUT',
        body: JSON.stringify({
            message: commitMessage,
            content: encodedContent,
        }),
    });

    return { newSha: response.content.sha };
  },

  deleteFile: async (token: string, owner: string, repoName: string, filePath: string, sha: string, commitMessage: string): Promise<void> => {
     await makeGithubRequest(`/repos/${owner}/${repoName}/contents/${filePath}`, token, {
        method: 'DELETE',
        body: JSON.stringify({
            message: commitMessage,
            sha: sha,
        }),
    }, false);
  },
};