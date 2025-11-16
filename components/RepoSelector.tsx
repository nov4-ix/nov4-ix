import React, { useState, useMemo } from 'react';
import { Repository } from '../types';
import { api } from '../services/api';
import { GithubIcon } from './icons/GithubIcon';
import { LockClosedIcon, LockOpenIcon } from './icons/LockIcons';
import { ForkIcon } from './icons/ForkIcon';
import { PlusIcon } from './icons/PlusIcon';
import Spinner from './Spinner';

interface RepoSelectorProps {
  onSelectRepo: (repo: Repository) => void;
  repos: Repository[];
  token: string | null;
  onRefreshRepos: () => void;
}

const RepoSelector: React.FC<RepoSelectorProps> = ({ onSelectRepo, repos, token, onRefreshRepos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fork state
  const [repoUrl, setRepoUrl] = useState('');
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  // Create state
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [isNewRepoPrivate, setIsNewRepoPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);


  const filteredRepos = useMemo(() => {
    if (!repos) return [];
    return repos.filter(repo =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [repos, searchTerm]);

  const handleForkClick = async () => {
    if (!token || !repoUrl.trim()) return;

    const urlRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/)?$/;
    const match = repoUrl.match(urlRegex);

    if (!match) {
      setForkError("URL de GitHub inválida. Por favor, usa el formato: https://github.com/owner/repo");
      return;
    }

    const [, owner, repo] = match;
    setForkError(null);
    setIsForking(true);

    try {
      const forkedRepo = await api.forkRepository(token, owner, repo);
      onRefreshRepos(); 
      onSelectRepo(forkedRepo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "No se pudo hacer fork del repositorio. Puede ser privado o ya existir en tu cuenta.";
      console.error("Forking failed:", err);
      setForkError(errorMessage);
    } finally {
      setIsForking(false);
    }
  };

  const handleCreateClick = async () => {
    if (!token || !newRepoName.trim()) return;
    setCreateError(null);
    setIsCreating(true);

    try {
      const newRepo = await api.createRepository(token, newRepoName, newRepoDesc, isNewRepoPrivate);
      await onRefreshRepos();
      onSelectRepo(newRepo);
    } catch(err) {
       const errorMessage = err instanceof Error ? err.message : "No se pudo crear el repositorio.";
       console.error("Creation failed:", err);
       setCreateError(errorMessage);
    } finally {
       setIsCreating(false);
    }
  }


  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Fork Card */}
        <div className="bg-[#122024]/50 border border-[#15333B] rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Haz un Fork para Empezar</h2>
          <p className="text-gray-400 mb-6 text-sm h-12">
            Pega la URL de un repo público para crear una copia y empezar a modificarlo.
          </p>
          
          {forkError && <p className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-xs">{forkError}</p>}
          
          <div className="space-y-3">
            <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full px-4 py-2 bg-[#171925] border border-[#15333B] rounded-lg font-mono focus:ring-2 focus:ring-[#B858FE] focus:border-[#B858FE] outline-none transition text-sm"
                disabled={isForking}
              />
            <button
              onClick={handleForkClick}
              disabled={isForking || !repoUrl.trim()}
              className="w-full flex items-center justify-center px-6 py-2.5 text-md font-bold bg-[#B858FE] text-black rounded-lg hover:bg-[#a048e0] transition-all duration-300 transform hover:scale-105 disabled:bg-[#15333B] disabled:text-gray-300 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isForking ? <Spinner /> : (<><ForkIcon className="h-5 w-5 mr-2" /> Fork y Editar</>)}
            </button>
          </div>
        </div>

        {/* Create Card */}
        <div className="bg-[#122024]/50 border border-[#15333B] rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Crear Nuevo Repositorio</h2>
          <p className="text-gray-400 mb-6 text-sm h-12">
            Inicia un proyecto desde cero en tu propia cuenta de GitHub.
          </p>
          
          {createError && <p className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-xs">{createError}</p>}
          
          <div className="space-y-3">
            <input
                type="text"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                placeholder="nombre-del-repositorio"
                className="w-full px-4 py-2 bg-[#171925] border border-[#15333B] rounded-lg focus:ring-2 focus:ring-[#B858FE] focus:border-[#B858FE] outline-none transition text-sm"
                disabled={isCreating}
            />
            <button
              onClick={handleCreateClick}
              disabled={isCreating || !newRepoName.trim()}
              className="w-full flex items-center justify-center px-6 py-2.5 text-md font-bold bg-[#40FDAE] text-black rounded-lg hover:bg-[#35e09b] transition-all duration-300 transform hover:scale-105 disabled:bg-[#15333B] disabled:text-gray-300 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isCreating ? <Spinner /> : (<><PlusIcon className="h-5 w-5 mr-2" /> Crear y Editar</>)}
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">O Selecciona un Repositorio Existente</h3>
        <p className="text-gray-400">Elige un proyecto que ya esté en tu cuenta de GitHub.</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar en tus repositorios..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-[#122024] border border-[#15333B] rounded-lg focus:ring-2 focus:ring-[#B858FE] focus:border-[#B858FE] outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepos.map(repo => (
          <div
            key={repo.id}
            onClick={() => onSelectRepo(repo)}
            className="bg-[#122024]/50 border border-[#15333B] rounded-lg p-5 cursor-pointer hover:bg-[#122024]/80 hover:border-[#B858FE] transition-all duration-200 group"
          >
            <div className="flex items-center mb-2">
              <GithubIcon className="h-5 w-5 mr-2 text-gray-400" />
              <h3 className="text-lg font-bold text-white group-hover:text-[#B858FE]">{repo.owner.login}/{repo.name}</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3 h-10 overflow-hidden">{repo.description}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  {repo.private ? <LockClosedIcon className="h-3 w-3 mr-1" /> : <LockOpenIcon className="h-3 w-3 mr-1" />}
                  {repo.private ? 'Privado' : 'Público'}
                </span>
                {repo.language && <span className="font-mono bg-[#15333B] px-1.5 py-0.5 rounded">{repo.language}</span>}
              </div>
              <span>Actualizado {new Date(repo.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
         {filteredRepos.length === 0 && (
            <p className="text-center col-span-2 text-gray-500">
                {repos.length === 0 ? "No se encontraron repositorios en tu cuenta." : "No se encontraron repositorios que coincidan con tu búsqueda."}
            </p>
         )}
      </div>
    </div>
  );
};

export default RepoSelector;