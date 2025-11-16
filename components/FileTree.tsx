import React, { useState, useMemo } from 'react';
import { FileTreeItem } from '../types';
import { FolderIcon, FolderOpenIcon } from './icons/FolderIcon';
import { FileIcon } from './icons/FileIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { BroomIcon } from './icons/BroomIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import Spinner from './Spinner';

interface FileTreeProps {
  fileTree: FileTreeItem[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onNewFile: () => void;
  onDeleteFile: (path: string, sha: string) => void;
  onAnalyzeProject: () => void;
  isAnalyzing: boolean;
  onRepoCleanup: () => void;
  isCleaning: boolean;
  onDefineRules: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'tree' | 'blob';
  sha: string;
  children?: { [key: string]: TreeNode };
}

const buildTree = (files: FileTreeItem[]): { [key: string]: TreeNode } => {
  const root: { [key: string]: TreeNode } = {};

  files.forEach(file => {
    let currentLevel = root;
    const pathParts = file.path.split('/');
    
    pathParts.forEach((part, index) => {
      const isLastPart = index === pathParts.length - 1;
      const currentPath = pathParts.slice(0, index + 1).join('/');

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: currentPath,
          sha: isLastPart ? file.sha : '',
          type: isLastPart && file.type === 'blob' ? 'blob' : 'tree',
          children: isLastPart && file.type === 'blob' ? undefined : {},
        };
      }
      if (currentLevel[part].children) {
        currentLevel = currentLevel[part].children!;
      }
    });
  });

  return root;
};

const TreeView: React.FC<{
  nodes: { [key: string]: TreeNode };
  level?: number;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string, sha: string) => void;
  openFolders: Set<string>;
  toggleFolder: (path: string) => void;
}> = ({ nodes, level = 0, selectedFile, onFileSelect, onDeleteFile, openFolders, toggleFolder }) => {
  const sortedNodes = (Object.values(nodes) as TreeNode[]).sort((a, b) => {
    if (a.type === 'tree' && b.type === 'blob') return -1;
    if (a.type === 'blob' && b.type === 'tree') return 1;
    return a.name.localeCompare(b.name);
  });
  
  return (
    <>
      {sortedNodes.map(node => (
        <div key={node.path}>
          {node.type === 'tree' ? (
            <div
              onClick={() => toggleFolder(node.path)}
              className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-[#122024]/50"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {openFolders.has(node.path) ? <FolderOpenIcon className="h-4 w-4 mr-2 flex-shrink-0 text-[#B858FE]" /> : <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0 text-[#B858FE]" />}
              <span className="truncate">{node.name}</span>
            </div>
          ) : (
            <div
              onClick={() => onFileSelect(node.path)}
              className={`w-full text-left flex items-center justify-between px-2 py-1.5 text-sm rounded group cursor-pointer ${selectedFile === node.path ? 'bg-[#B858FE]/20 text-[#BCAACD]' : 'hover:bg-[#122024]/50'}`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <div className="flex items-center truncate">
                <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{node.name}</span>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDeleteFile(node.path, node.sha); 
                  }} 
                  className="p-1 text-gray-500 hover:text-red-400 rounded-full hover:bg-red-500/10"
                  aria-label={`Delete ${node.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {node.type === 'tree' && openFolders.has(node.path) && node.children && (
            <TreeView
              nodes={node.children}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
            />
          )}
        </div>
      ))}
    </>
  );
};


const FileTree: React.FC<FileTreeProps> = ({ fileTree, selectedFile, onFileSelect, onNewFile, onDeleteFile, onAnalyzeProject, isAnalyzing, onRepoCleanup, isCleaning, onDefineRules }) => {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const tree = useMemo(() => buildTree(fileTree), [fileTree]);

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
        <div className="px-2 pb-2 border-b border-[#15333B] space-y-2">
            <button 
                onClick={onAnalyzeProject}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center px-2 py-1.5 text-sm text-gray-300 bg-[#15333B]/50 hover:bg-[#15333B] rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isAnalyzing ? <Spinner size="sm"/> : <ClipboardCheckIcon className="h-4 w-4"/>}
                <span className="ml-2">{isAnalyzing ? 'Analizando...' : 'Analizar Proyecto'}</span>
            </button>
             <button 
                onClick={onRepoCleanup}
                disabled={isCleaning}
                className="w-full flex items-center justify-center px-2 py-1.5 text-sm text-gray-300 bg-[#15333B]/50 hover:bg-[#15333B] rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isCleaning ? <Spinner size="sm"/> : <BroomIcon className="h-4 w-4"/>}
                <span className="ml-2">{isCleaning ? 'Buscando...' : 'Depurar Repositorio'}</span>
            </button>
             <button 
                onClick={onDefineRules}
                className="w-full flex items-center justify-center px-2 py-1.5 text-sm text-gray-300 bg-[#15333B]/50 hover:bg-[#15333B] rounded-md transition-colors"
            >
                <ShieldCheckIcon className="h-4 w-4 mr-2"/>
                Definir Reglas
            </button>
            <button 
                onClick={onNewFile}
                className="w-full flex items-center justify-center px-2 py-1.5 text-sm text-gray-300 bg-[#15333B]/50 hover:bg-[#15333B] rounded-md transition-colors"
            >
                <PlusIcon className="h-4 w-4 mr-2"/>
                Nuevo Archivo
            </button>
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
            <TreeView 
                nodes={tree} 
                selectedFile={selectedFile} 
                onFileSelect={onFileSelect}
                onDeleteFile={onDeleteFile}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
            />
        </div>
    </div>
  );
};

export default FileTree;