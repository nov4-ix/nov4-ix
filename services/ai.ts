import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig, AIProvider, ProjectAnalysisFinding, RepoCleanupSuggestion } from "../types";

// --- System Prompt ---
const generateSystemInstruction = (fileName: string, fullFileTree: string, aiRules: string) => {
    let rulesSection = '';
    if (aiRules && aiRules.trim()) {
        rulesSection = `
The user has provided the following rules that you MUST follow. This is the highest priority instruction.
--- USER-DEFINED RULES ---
${aiRules.trim()}
--- END OF RULES ---
`;
    }

    return `You are an expert software engineer AI assistant.
Your task is to help the user with their code.
You will be given the content of a file, a user instruction, the filename, and the project's file structure.
${rulesSection}
The user wants to modify the file: \`${fileName}\`.

This is the full file structure of the project:
\`\`\`
${fullFileTree}
\`\`\`

IMPORTANT:
- Respond ONLY with the full, updated code for the file \`${fileName}\`.
- Do not add any explanations, introductory text, or markdown formatting like \`\`\`typescript.
- Your response should be the raw text of the file content and nothing else.
- Ensure the code is complete and syntactically correct.
- If the user's request is unclear or cannot be fulfilled, return the original code without any changes.
`;
};

// --- Main API Abstraction ---
interface GenerateCodeParams {
    config: AIConfig;
    fileContent: string;
    userInstruction: string;
    fileName: string;
    fullFileTree: string;
    aiRules: string;
    signal: AbortSignal;
}

export const generateCodeSuggestion = async (params: GenerateCodeParams): Promise<string> => {
    switch (params.config.provider) {
        case AIProvider.GEMINI:
            return generateWithGemini(params);
        case AIProvider.OPENAI:
            return generateWithOpenAI(params);
        case AIProvider.ANTHROPIC:
            return generateWithAnthropic(params);
        default:
            throw new Error(`Unsupported AI provider: ${params.config.provider}`);
    }
};


// --- Project Analysis ---
interface GenerateProjectAnalysisParams {
    config: AIConfig;
    fileTree: string;
    filesContent: { path: string; content: string }[];
}

export const generateProjectAnalysis = async ({ config, fileTree, filesContent }: GenerateProjectAnalysisParams): Promise<ProjectAnalysisFinding[]> => {
    if (config.provider !== AIProvider.GEMINI) {
        return [{
            file: 'App.tsx',
            severity: 'warning',
            description: 'Función no soportada',
            suggestion: 'El análisis de proyectos solo es compatible con el proveedor Gemini. Por favor, cambia a Gemini en la configuración de la IA para utilizar esta función.'
        }];
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are an expert senior software engineer performing a comprehensive code review on a project. Analyze the provided file structure and file contents to identify issues and suggest improvements. Provide your response as a JSON array of objects that strictly follows the provided schema. Focus on providing actionable, high-quality feedback.`;
    
    const filesContentString = filesContent.map(file => `--- FILE: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\``).join('\n\n');
    const prompt = `Here is the project's file structure:\n${fileTree}\n\nHere is the content of key files:\n${filesContentString}\n\nPlease analyze the project for the following:\n1.  **Bugs & Errors**: Look for syntax errors, logical flaws, potential runtime errors, and incorrect API usage.\n2.  **Best Practices & Code Smell**: Check for deviations from common best practices (e.g., improper state management, large components, missing keys in React lists, unused variables).\n3.  **Performance**: Identify potential performance bottlenecks (e.g., unnecessary re-renders, inefficient loops).\n4.  **Security**: Point out any obvious security vulnerabilities.\n5.  **Dependencies**: Analyze \`package.json\` for potential issues.\n\nProvide a list of your findings. If no issues are found, return an empty array [].`;

    try {
        const response = await ai.models.generateContent({
            model: config.model || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            file: { type: Type.STRING, description: 'The file path related to the finding.' },
                            line: { type: Type.INTEGER, description: 'The relevant line number, if applicable. Omit this field if the finding applies to the whole file.' },
                            severity: { type: Type.STRING, enum: ['error', 'warning', 'suggestion'], description: 'The severity of the issue.' },
                            description: { type: Type.STRING, description: 'A clear and concise description of the issue.' },
                            suggestion: { type: Type.STRING, description: 'A detailed suggestion on how to fix it, including code snippets.' }
                        },
                        required: ['file', 'severity', 'description', 'suggestion']
                    }
                }
            }
        });
        
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as ProjectAnalysisFinding[];
    } catch (error) {
        console.error("Error with Gemini API during project analysis:", error);
        throw new Error(`Análisis del proyecto falló: ${(error as Error).message}`);
    }
};

// --- Apply Project Analysis Suggestion ---
interface ApplyAnalysisSuggestionParams {
    config: AIConfig;
    fileContent: string;
    finding: ProjectAnalysisFinding;
    userRefinement: string;
}

export const applyProjectAnalysisSuggestion = async ({ config, fileContent, finding, userRefinement }: ApplyAnalysisSuggestionParams): Promise<string> => {
    if (config.provider !== AIProvider.GEMINI) {
        throw new Error('La aplicación automática de sugerencias solo es compatible con el proveedor Gemini.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `You are an expert AI programmer. Your task is to apply a suggested code change to a file, taking into account an optional user's refinement of the suggestion.

You will be given:
1.  The original code of the file \`${finding.file}\`.
2.  A description of an issue found in the code.
3.  A suggested solution from a previous analysis.
4.  An optional refinement or instruction from the user.

Your goal is to integrate the suggested solution into the original code, modifying it as requested by the user's refinement.

IMPORTANT:
- Respond ONLY with the full, updated code for the file.
- Do not add any explanations, introductory text, or markdown formatting like \`\`\`typescript.
- Your response should be the raw text of the file content and nothing else.
- If the user's refinement is empty, just apply the original suggestion.
- Ensure the final code is complete and correct.`;

    const prompt = `
File: \`${finding.file}\`

--- ORIGINAL CODE ---
\`\`\`
${fileContent}
\`\`\`

--- ANALYSIS FINDING ---
Description: ${finding.description}
Original Suggestion: ${finding.suggestion}

--- USER REFINEMENT ---
${userRefinement || "No specific refinement. Please apply the original suggestion."}

--- TASK ---
Based on all the information above, provide the full and complete updated code for the file \`${finding.file}\`.
`;

    try {
        const response = await ai.models.generateContent({
            model: config.model || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
            }
        });

        const text = response.text;
        if (typeof text !== 'string') {
            console.error("Gemini API response did not contain text:", response);
            throw new Error("La respuesta de la IA no contenía texto válido. Puede haber sido bloqueada por seguridad.");
        }
        return text.trim();

    } catch (error) {
        console.error("Error with Gemini API during suggestion application:", error);
        throw new Error(`La aplicación de la sugerencia falló: ${(error as Error).message}`);
    }
};


// --- Repo Cleanup ---
interface GenerateRepoCleanupParams {
    config: AIConfig;
    fileTree: string;
}

export const generateRepoCleanupSuggestions = async ({ config, fileTree }: GenerateRepoCleanupParams): Promise<RepoCleanupSuggestion[]> => {
     if (config.provider !== AIProvider.GEMINI) {
        return [{
            path: 'N/A',
            reason: 'La depuración de repositorios solo es compatible con el proveedor Gemini. Por favor, cambia a Gemini en la configuración de la IA.'
        }];
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are an expert software engineer specializing in repository maintenance. Your task is to identify unnecessary files that should be deleted. Analyze the provided file list and return a JSON array of objects, each containing the 'path' of the file to delete and a brief 'reason'.`;
    
    const prompt = `Analyze the following file tree and identify unnecessary files. Unnecessary files include:
- Build artifacts (e.g., 'dist', 'build', 'out', '.next', '.vercel').
- Local environment files that are not templates (e.g., '.env', '.env.local').
- Log files (e.g., 'npm-debug.log').
- System-specific files (e.g., '.DS_Store', 'Thumbs.db').
- Dependency caches (e.g., 'node_modules', 'yarn.lock', 'pnpm-lock.yaml' if a 'package-lock.json' also exists).
- Test reports or coverage output (e.g., 'coverage').
- Duplicate or clearly temporary files.

File Tree:
\`\`\`
${fileTree}
\`\`\`

If no files need to be deleted, return an empty array [].`;

    try {
        const response = await ai.models.generateContent({
            model: config.model || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            path: { type: Type.STRING, description: 'The full path of the file to be deleted.' },
                            reason: { type: Type.STRING, description: 'A brief explanation for why the file is unnecessary.' }
                        },
                        required: ['path', 'reason']
                    }
                }
            }
        });
        
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as RepoCleanupSuggestion[];
    } catch (error) {
        console.error("Error with Gemini API during repo cleanup analysis:", error);
        throw new Error(`Análisis de depuración falló: ${(error as Error).message}`);
    }
}

// --- Gemini Implementation ---
// FIX: Refactored to align with @google/genai guidelines by removing deprecated API usage and ineffective abort/timeout logic.
const generateWithGemini = async ({ config, fileContent, userInstruction, fileName, fullFileTree, aiRules, signal }: GenerateCodeParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = generateSystemInstruction(fileName, fullFileTree, aiRules);
    const prompt = `Original code from \`${fileName}\`:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser instruction: "${userInstruction}"\n\nPlease provide the full updated code for \`${fileName}\`.`;

    // The `signal` parameter from GenerateCodeParams is unused here because
    // the Gemini SDK's `generateContent` method does not support AbortSignal cancellation.

    try {
        const response = await ai.models.generateContent({
             model: config.model || 'gemini-2.5-flash',
             contents: prompt,
             config: {
                systemInstruction: systemInstruction,
             }
        });
        const text = response.text;
        if (typeof text !== 'string') {
            console.error("Gemini API response did not contain text:", response);
            throw new Error("La respuesta de la IA no contenía texto válido. Puede haber sido bloqueada por seguridad.");
        }
        return text.trim();
    } catch (error) {
        console.error("Error with Gemini API:", error);
        throw error;
    }
};

// --- OpenAI / Ollama Implementation ---
const generateWithOpenAI = async ({ config, fileContent, userInstruction, fileName, fullFileTree, aiRules, signal }: GenerateCodeParams): Promise<string> => {
    const systemInstruction = generateSystemInstruction(fileName, fullFileTree, aiRules);
    const prompt = `Original code from \`${fileName}\`:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser instruction: "${userInstruction}"\n\nPlease provide the full updated code for \`${fileName}\`.`;
    
    const url = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        signal: signal,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`OpenAI API Error: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
};


// --- Anthropic Implementation ---
const generateWithAnthropic = async ({ config, fileContent, userInstruction, fileName, fullFileTree, aiRules, signal }: GenerateCodeParams): Promise<string> => {
    const systemInstruction = generateSystemInstruction(fileName, fullFileTree, aiRules);
    const prompt = `Original code from \`${fileName}\`:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser instruction: "${userInstruction}"\n\nPlease provide the full updated code for \`${fileName}\`.`;
    
    const url = 'https://api.anthropic.com/v1/messages';

    const response = await fetch(url, {
        method: 'POST',
        signal: signal,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: config.model,
            system: systemInstruction,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
            temperature: 0.1,
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Anthropic API Error: ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
};