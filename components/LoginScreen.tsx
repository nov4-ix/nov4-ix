import React, { useState } from 'react';
import { GithubIcon } from './icons/GithubIcon';
import Spinner from './Spinner';

interface LoginScreenProps {
  onLogin: (token: string, remember: boolean) => void;
  loading: boolean;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loading, error }) => {
  const [token, setToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLoginClick = () => {
    if (token.trim()) {
      onLogin(token.trim(), rememberMe);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center p-8 bg-[#122024]/50 border border-[#15333B] rounded-xl shadow-2xl max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">Conecta con tu GitHub</h2>
        <p className="text-gray-400 mb-6">
          Ingresa un Token de Acceso Personal para conectar de forma segura a tu cuenta de GitHub y gestionar tus repositorios.
        </p>

        {error && <p className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</p>}
        
        <div className="space-y-4">
           <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-4 py-3 bg-[#171925] border border-[#15333B] rounded-lg font-mono text-center focus:ring-2 focus:ring-[#B858FE] focus:border-[#B858FE] outline-none transition"
            />
          <div className="flex items-center text-left pt-1">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#15333B] bg-[#122024] text-[#B858FE] focus:ring-[#B858FE]"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-400 cursor-pointer">
              Recordar mi token
            </label>
          </div>
          <button
            onClick={handleLoginClick}
            disabled={loading || !token.trim()}
            className="w-full flex items-center justify-center px-6 py-3 text-lg font-bold bg-[#B858FE] text-black rounded-lg hover:bg-[#a048e0] transition-all duration-300 transform hover:scale-105 disabled:bg-[#15333B] disabled:text-gray-300 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                <GithubIcon className="h-6 w-6 mr-3" />
                Conectar con Token
              </>
            )}
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-4 text-left p-3 bg-[#171925]/50 rounded-md border border-[#15333B]">
           <p className="font-bold text-yellow-400 mb-1">⚠️ Aviso de Seguridad</p>
           Si marcas "Recordar mi token", se guardará de forma persistente en tu navegador. Si no lo haces, el token se borrará cuando cierres la pestaña.
           <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-[#40FDAE] hover:underline"> Crea un nuevo token aquí</a> con `repo` scope.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;