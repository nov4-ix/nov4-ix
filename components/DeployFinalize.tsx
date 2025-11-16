import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DeploymentConfig, Platform, Repository } from '../types';
import { api } from '../services/api';
import Button from './Button';
import { BackArrowIcon } from './icons/BackArrowIcon';
import Spinner from './Spinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { InfoIcon } from './icons/InfoIcon';
import { VercelIcon } from './icons/VercelIcon';
import { NetlifyIcon } from './icons/NetlifyIcon';
import { RailwayIcon } from './icons/RailwayIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import hljs from 'highlight.js';


interface DeployFinalizeProps {
  token: string;
  config: DeploymentConfig;
  onBack: () => void;
  onComplete: () => void;
}

enum ProjectType {
    NEXTJS = 'Next.js',
    VITE = 'Vite',
    CRA = 'Create React App',
    GENERIC_NODE = 'Generic Node.js',
    UNKNOWN = 'Unknown'
}

interface ChecklistItem {
    text: string;
    status: 'success' | 'warning' | 'error' | 'info';
    details?: string;
}

interface AnalysisResult {
    projectType: ProjectType;
    packageJson: any;
    checklist: ChecklistItem[];
}

// --- Config Generators ---
const generateVercelConfig = (analysis: AnalysisResult | null) => {
    if (!analysis) return {};
    const { projectType, packageJson } = analysis;
    const config: any = { "$schema": "https://openapi.vercel.sh/vercel.json" };

    switch (projectType) {
        case ProjectType.NEXTJS:
            config.framework = "nextjs";
            break;
        case ProjectType.VITE:
            config.framework = "vite";
            config.outputDirectory = "dist";
            config.buildCommand = packageJson?.scripts?.build || 'vite build';
            break;
        case ProjectType.CRA:
            config.framework = "create-react-app";
            config.outputDirectory = "build";
            config.buildCommand = packageJson?.scripts?.build || 'react-scripts build';
            break;
        default:
             config.note = "Vercel will attempt to auto-detect configuration.";
    }
     if (packageJson?.engines?.node) {
        config.engines = { "node": packageJson.engines.node };
    }
    return config;
};

const generateNetlifyConfig = (analysis: AnalysisResult | null) => {
    if (!analysis) return "";
    const { projectType, packageJson } = analysis;
    const buildCommand = packageJson?.scripts?.build || 'npm run build';
    let publishDir = 'dist';
    if (projectType === ProjectType.CRA) publishDir = 'build';
    if (projectType === ProjectType.NEXTJS) publishDir = '.next';

    let config = `
[build]
  command = "${buildCommand}"
  publish = "${publishDir}"
`;
    if (packageJson?.engines?.node) {
        config += `
[build.environment]
  NODE_VERSION = "${packageJson.engines.node.replace('>=','').split(' ')[0]}"
`;
    }
    config += `
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
    return config.trim();
};

const generateRailwayConfig = (analysis: AnalysisResult | null) => {
    if (!analysis) return {};
    const { packageJson } = analysis;
    return {
        "$schema": "https://railway.app/railway.schema.json",
        "build": {
            "builder": "NIXPACKS",
            "nixpacksConfig": {
                "startCommand": packageJson?.scripts?.start || 'npm start'
            }
        },
        "deploy": {
            "startCommand": packageJson?.scripts?.start || 'npm start',
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
        }
    };
};
// --- End Config Generators ---

const ConfigExplanation: React.FC<{ platform: Platform; analysis: AnalysisResult }> = ({ platform, analysis }) => {
    const explanations: { key: string; description: string; sub?: boolean }[] = [];

    switch (platform) {
        case Platform.VERCEL:
            const vercelConfig = generateVercelConfig(analysis);
            explanations.push({ key: '$schema', description: 'Define la estructura oficial del archivo para que Vercel lo entienda correctamente.' });
            if (vercelConfig.framework) explanations.push({ key: 'framework', description: `Le dice a Vercel que tu proyecto es de tipo '${vercelConfig.framework}', permitiendo optimizaciones automáticas.` });
            if (vercelConfig.outputDirectory) explanations.push({ key: 'outputDirectory', description: `Indica la carpeta (en este caso '${vercelConfig.outputDirectory}') donde se guardan los archivos finales de tu proyecto tras la compilación.` });
            if (vercelConfig.buildCommand) explanations.push({ key: 'buildCommand', description: 'El comando exacto que Vercel ejecutará para construir tu aplicación antes de desplegarla.' });
            if (vercelConfig.engines) explanations.push({ key: 'engines.node', description: `Asegura que Vercel use la versión de Node.js ('${vercelConfig.engines.node}') que tu proyecto necesita.` });
            if (vercelConfig.note) explanations.push({ key: 'note', description: 'Un comentario informativo que indica que Vercel es lo suficientemente inteligente como para detectar la configuración si no se especifica explícitamente.' });
            break;
        
        case Platform.NETLIFY:
             const netlifyToml = generateNetlifyConfig(analysis);
             const publishDir = netlifyToml.match(/publish = "(.*)"/)?.[1] || 'dist';
             explanations.push({ key: '[build]', description: 'Esta sección principal contiene todas las instrucciones para construir tu proyecto.' });
             explanations.push({ key: 'command', description: 'El comando que Netlify ejecutará para compilar tu sitio.', sub: true });
             explanations.push({ key: 'publish', description: `La carpeta ('${publishDir}') que Netlify desplegará una vez que la construcción haya finalizado.`, sub: true });
             if (analysis.packageJson?.engines?.node) {
                 explanations.push({ key: '[build.environment]', description: 'Define variables específicas para el entorno de construcción.', sub: true });
                 explanations.push({ key: 'NODE_VERSION', description: `Asegura que Netlify use la versión de Node.js correcta para tu proyecto.`, sub: true });
             }
             explanations.push({ key: '[[redirects]]', description: 'Configura cómo se manejan las rutas. Esta regla es clave para apps de una sola página (SPA), asegurando que todas las rutas carguen tu app correctamente.' });
             break;

        case Platform.RAILWAY:
            const railwayConfig = generateRailwayConfig(analysis);
            explanations.push({ key: '$schema', description: 'Define la estructura oficial del archivo para que Railway lo entienda correctamente.' });
            explanations.push({ key: 'build', description: 'Contiene las instrucciones sobre cómo construir tu aplicación.' });
            explanations.push({ key: 'builder: "NIXPACKS"', description: "Usa Nixpacks, un sistema automático que detecta el lenguaje de tu proyecto y lo construye sin necesidad de un Dockerfile.", sub: true });
            explanations.push({ key: 'startCommand', description: `El comando ('${railwayConfig.build.nixpacksConfig.startCommand}') para iniciar tu aplicación después de construirla.`, sub: true });
            explanations.push({ key: 'deploy', description: 'Configura cómo se ejecuta tu aplicación una vez desplegada.' });
            explanations.push({ key: 'restartPolicyType', description: "Le dice a Railway que reinicie automáticamente la aplicación si falla ('ON_FAILURE').", sub: true });
            break;
    }

    return (
        <div className="bg-[#171925]/80 rounded-b-md p-4 mt-2 text-xs space-y-3 border-t-2 border-[#15333B]">
             <h4 className="text-sm font-semibold text-gray-200">Explicación del Archivo de Configuración</h4>
             {explanations.map((ex, index) => (
                 <div key={index} className={ex.sub ? 'pl-4 border-l-2 border-[#15333B]' : ''}>
                     <p><code className="font-bold text-[#40FDAE] bg-[#15333B]/50 px-1.5 py-0.5 rounded">{ex.key}</code></p>
                     <p className="text-gray-400 pl-1">{ex.description}</p>
                 </div>
             ))}
        </div>
    );
};


const PlatformTab: React.FC<{
    platform: Platform;
    selectedPlatform: Platform;
    onClick: (platform: Platform) => void;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}> = ({ platform, selectedPlatform, onClick, Icon }) => (
    <button
        onClick={() => onClick(platform)}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            selectedPlatform === platform
                ? 'border-[#B858FE] text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-[#40FDAE]'
        }`}
    >
        <Icon className="h-5 w-5" />
        <span>{platform}</span>
    </button>
);


const DeployFinalize: React.FC<DeployFinalizeProps> = ({ token, config, onBack, onComplete }) => {
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(config.platform);
  const [commitMessage, setCommitMessage] = useState(`feat: Add ${config.platform} deployment configuration`);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const { repo } = config;

  useEffect(() => {
    const analyzeRepo = async () => {
        setIsLoadingAnalysis(true);
        let detectedType = ProjectType.UNKNOWN;
        let pkgJson: any = null;
        const newChecklist: ChecklistItem[] = [];

        try {
            const hasPackageJson = repo.fileTree.some(f => f.path === 'package.json');
            if (hasPackageJson) {
                newChecklist.push({ text: '`package.json` encontrado', status: 'success' });
                const { content } = await api.getFileContent(token, repo.owner.login, repo.name, 'package.json');
                pkgJson = JSON.parse(content);

                if (pkgJson?.dependencies?.['next']) detectedType = ProjectType.NEXTJS;
                else if (pkgJson?.devDependencies?.['vite'] || pkgJson?.dependencies?.['vite']) detectedType = ProjectType.VITE;
                else if (pkgJson?.dependencies?.['react-scripts']) detectedType = ProjectType.CRA;
                else detectedType = ProjectType.GENERIC_NODE;
                newChecklist.push({ text: `Tipo de proyecto detectado: ${detectedType}`, status: 'info' });

                if (pkgJson?.scripts?.build) newChecklist.push({ text: 'Script de construcción (`build`) encontrado', status: 'success' });
                else newChecklist.push({ text: 'No se encontró script de `build`', status: 'warning', details: 'El despliegue podría fallar si se requiere un paso de construcción.' });
                
                if (pkgJson?.scripts?.start) newChecklist.push({ text: 'Script de inicio (`start`) encontrado', status: 'success' });
                else newChecklist.push({ text: 'No se encontró script de `start`', status: 'warning', details: 'Necesario para plataformas como Railway.' });
                
                if (pkgJson?.engines?.node) newChecklist.push({ text: `Versión de Node.js especificada: ${pkgJson.engines.node}`, status: 'success' });
                else newChecklist.push({ text: 'Versión de Node.js no especificada', status: 'info', details: 'Se usará la versión por defecto de la plataforma.' });

            } else {
                newChecklist.push({ text: 'No se encontró `package.json`', status: 'error', details: 'La configuración automática no es posible sin este archivo.' });
            }
            
            const hasGitignore = repo.fileTree.some(f => f.path === '.gitignore');
            if(hasGitignore) newChecklist.push({ text: 'Archivo `.gitignore` configurado', status: 'success' });
            else newChecklist.push({ text: 'No se encontró archivo `.gitignore`', status: 'warning', details: 'Podrías estar subiendo archivos innecesarios.' });

            const hasNodeModules = repo.fileTree.some(f => f.path.startsWith('node_modules/'));
            if(!hasNodeModules) newChecklist.push({ text: '`node_modules` no está en el repositorio', status: 'success' });
            else newChecklist.push({ text: '`node_modules` encontrado en el repositorio', status: 'error', details: 'Esta carpeta nunca debe ser subida a Git. Añádela a tu .gitignore.' });

            const hasEnvFile = repo.fileTree.some(f => f.path === '.env');
            if(!hasEnvFile) newChecklist.push({ text: 'No se encontraron archivos `.env` inseguros', status: 'success' });
            else newChecklist.push({ text: 'Archivo `.env` encontrado en el repositorio', status: 'error', details: 'Es una grave vulnerabilidad de seguridad. Usa las variables de entorno de la plataforma.' });

            setAnalysisResult({ projectType: detectedType, packageJson: pkgJson, checklist: newChecklist });

        } catch (e) {
            newChecklist.push({ text: 'Error al analizar el repositorio', status: 'error', details: (e as Error).message });
            setAnalysisResult({ projectType: detectedType, packageJson: pkgJson, checklist: newChecklist });
        } finally {
            setIsLoadingAnalysis(false);
        }
    };
    analyzeRepo();
  }, [repo, token]);

  const { configFileContent, configFileName, deploymentUrl } = useMemo(() => {
    let content: string;
    let name: string;
    let url: string;

    const repoUrl = `https://github.com/${repo.owner.login}/${repo.name}`;

    switch(selectedPlatform) {
        case Platform.VERCEL:
            content = JSON.stringify(generateVercelConfig(analysisResult), null, 2);
            name = 'vercel.json';
            const vercelParams = new URLSearchParams({
                'repository-url': repoUrl,
                'project-name': repo.name,
                'framework': (analysisResult?.projectType === ProjectType.NEXTJS ? 'nextjs' : (analysisResult?.projectType === ProjectType.VITE ? 'vite' : 'other')),
            });
            url = `https://vercel.com/new/clone?${vercelParams.toString()}`;
            break;
        case Platform.NETLIFY:
            content = generateNetlifyConfig(analysisResult);
            name = 'netlify.toml';
            url = `https://app.netlify.com/start/deploy?repository=${repoUrl}`;
            break;
        case Platform.RAILWAY:
            content = JSON.stringify(generateRailwayConfig(analysisResult), null, 2);
            name = 'railway.json';
            url = `https://railway.app/new/template?template=${repoUrl}`;
            break;
        default:
            content = "// Plataforma no soportada";
            name = "config.txt";
            url = repoUrl;
    }
    return { configFileContent: content, configFileName: name, deploymentUrl: url };
  }, [selectedPlatform, analysisResult, repo]);
  
  // Effect to apply syntax highlighting to the config file preview
  useEffect(() => {
      if (codeRef.current) {
          hljs.highlightElement(codeRef.current);
      }
  }, [configFileContent]);

  const handlePlatformChange = (platform: Platform) => {
      setSelectedPlatform(platform);
      setCommitMessage(`feat: Add ${platform} deployment configuration`);
  }

  const commitSuggestions = {
      [Platform.VERCEL]: ["feat: Add Vercel deployment configuration", "chore: Setup Vercel deployment", "ci: Configure Vercel build settings"],
      [Platform.NETLIFY]: ["feat: Add Netlify deployment configuration", "chore: Setup Netlify deployment", "ci: Configure Netlify build settings"],
      [Platform.RAILWAY]: ["feat: Add Railway deployment configuration", "chore: Setup Railway deployment", "ci: Configure Railway build settings"],
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    setError(null);
    try {
      await api.commitConfigurationFile(token, repo.owner.login, repo.name, configFileName, configFileContent, commitMessage);
      setIsSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to commit configuration file: ${errorMessage}`);
    } finally {
      setIsCommitting(false);
    }
  };
  
  if (isSuccess) {
    return (
        <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-2 text-green-400">¡Configuración Confirmada!</h2>
            <p className="text-gray-400 mb-6">El archivo <strong>{configFileName}</strong> ha sido añadido a tu repositorio. Ahora estás listo para el despliegue final.</p>
            <div className="bg-[#122024]/50 border border-[#15333B] rounded-lg p-6 space-y-4">
                <p className="text-lg">Haz clic en el botón de abajo para importar tu repositorio en <strong>{selectedPlatform}</strong> y completar el despliegue.</p>
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                    <Button fullWidth> Desplegar en {selectedPlatform} </Button>
                </a>
            </div>
             <button onClick={onComplete} className="text-sm text-[#40FDAE] hover:text-[#35e09b] mt-6"> Desplegar otro proyecto </button>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center text-sm text-[#40FDAE] hover:text-[#35e09b] mb-4">
        <BackArrowIcon className="h-4 w-4 mr-1"/> Volver a la Configuración
      </button>
      <h2 className="text-3xl font-bold mb-2">Finalizar Despliegue</h2>
      <p className="text-gray-400 mb-6">Confirma los detalles para añadir el archivo de configuración a tu repositorio <strong>{repo.name}</strong>.</p>
      
      {error && <p className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</p>}

      <div className="space-y-6 bg-[#122024]/50 border border-[#15333B] rounded-lg p-6">
        <div>
            <h3 className="text-lg font-semibold mb-3">Análisis Pre-despliegue</h3>
            {isLoadingAnalysis ? <div className="flex items-center space-x-2 text-gray-400"><Spinner size="sm"/> <span>Analizando repositorio...</span></div> : (
                <ul className="space-y-2 text-sm">
                    {analysisResult?.checklist.map((item, index) => (
                        <li key={index} className="flex items-start">
                             {item.status === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 text-green-400 flex-shrink-0"/>}
                             {item.status === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5 text-yellow-400 flex-shrink-0"/>}
                             {item.status === 'error' && <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5 text-red-400 flex-shrink-0"/>}
                             {item.status === 'info' && <InfoIcon className="h-5 w-5 mr-2 mt-0.5 text-[#047AF6] flex-shrink-0"/>}
                            <div>
                               <span className={item.status === 'error' ? 'text-red-300' : 'text-gray-300'}>{item.text}</span>
                               {item.details && <p className="text-xs text-gray-500">{item.details}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Plataforma y Configuración</h3>
                <button 
                  onClick={() => setShowExplanation(!showExplanation)} 
                  className="flex items-center text-xs text-gray-400 hover:text-[#40FDAE] transition-colors"
                  disabled={isLoadingAnalysis}
                  >
                    <QuestionMarkCircleIcon className="h-4 w-4 mr-1"/>
                    {showExplanation ? 'Ocultar Explicación' : 'Explicar este Código'}
                </button>
            </div>
             <div className="border-b border-[#15333B]">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                   <PlatformTab platform={Platform.VERCEL} selectedPlatform={selectedPlatform} onClick={handlePlatformChange} Icon={VercelIcon} />
                   <PlatformTab platform={Platform.NETLIFY} selectedPlatform={selectedPlatform} onClick={handlePlatformChange} Icon={NetlifyIcon} />
                   <PlatformTab platform={Platform.RAILWAY} selectedPlatform={selectedPlatform} onClick={handlePlatformChange} Icon={RailwayIcon} />
                </nav>
            </div>
            <div className="bg-[#171925]/50 rounded-b-md">
                <pre className="p-4 text-xs overflow-x-auto max-h-48">
                    <code ref={codeRef} className={configFileName.endsWith('.json') ? 'language-json' : (configFileName.endsWith('.toml') ? 'language-toml' : 'language-plaintext')}>
                        {configFileContent}
                    </code>
                </pre>
                {showExplanation && analysisResult && (
                    <ConfigExplanation platform={selectedPlatform} analysis={analysisResult} />
                )}
            </div>
        </div>
        
        <div>
           <h3 className="text-lg font-semibold mb-2">Mensaje de Commit</h3>
           <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md font-mono text-sm outline-none focus:ring-1 focus:ring-[#B858FE]"
            />
            <div className="flex flex-wrap gap-2 mt-2">
                {commitSuggestions[selectedPlatform].map(suggestion => (
                    <button key={suggestion} onClick={() => setCommitMessage(suggestion)} className="px-2 py-1 text-xs bg-[#15333B]/80 hover:bg-[#15333B] rounded-full">
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="pt-4 border-t border-[#15333B]">
            <p className="text-xs text-gray-500 mb-4">Esta acción creará o actualizará el archivo <strong>{configFileName}</strong> en la rama principal de tu repositorio.</p>
            <Button onClick={handleCommit} disabled={isCommitting || isLoadingAnalysis || !commitMessage.trim()} fullWidth isLoading={isCommitting}>
                {isCommitting ? 'Confirmando...' : `Confirmar y Proceder a ${selectedPlatform}`}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default DeployFinalize;