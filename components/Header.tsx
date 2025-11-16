import React from 'react';
import { User } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import { GithubIcon } from './icons/GithubIcon';
import { CogIcon } from './icons/CogIcon';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenAiConfig: () => void;
  isVscode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onOpenAiConfig, isVscode = false }) => {
  return (
    <header className="bg-[#1C232E]/50 border-b border-[#15333B] backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <LogoIcon className="h-8 w-8 text-[#B858FE]" />
            <span className="ml-3 text-2xl font-bold text-white tracking-tight">Son1k-GO!</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={onOpenAiConfig} className="p-2 rounded-full text-gray-400 hover:bg-[#122024]/50 hover:text-white transition-colors">
              <CogIcon className="h-6 w-6" />
            </button>
            {!isVscode && (
              user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm">
                      <GithubIcon className="h-5 w-5 mr-2 text-gray-400"/>
                      <span className="text-gray-300">{user.name}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#122024]/50 rounded-md hover:bg-[#122024]"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                  <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Obtener token de GitHub
                  </a>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;