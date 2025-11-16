
// This interface must be declared in the webview and cannot be imported from vscode
interface IVsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(newState: any): void;
}

// This global function is provided by VS Code in the webview context
declare const acquireVsCodeApi: () => IVsCodeApi;

type MessageCallback = (payload: any) => void;

class VscodeApi {
  private readonly vscodeApi: IVsCodeApi | undefined;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void; }>;
  private subscribers: Map<string, Set<MessageCallback>>;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor() {
    this.pendingRequests = new Map();
    this.subscribers = new Map();
    if (typeof acquireVsCodeApi === 'function') {
      this.vscodeApi = acquireVsCodeApi();
      this.messageListener = (event: MessageEvent) => this.handleMessage(event.data);
      window.addEventListener('message', this.messageListener);
    }
  }

  private handleMessage(message: { command: string; payload: any, requestId?: string, error?: string }) {
      const { command, requestId, payload, error } = message;

      if (requestId) { // This is a response to a request
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            if (error) {
                pending.reject(new Error(error));
            } else {
                pending.resolve(payload);
            }
            this.pendingRequests.delete(requestId);
        }
      } else { // This is a notification from the extension
          const commandSubscribers = this.subscribers.get(command);
          if (commandSubscribers) {
              commandSubscribers.forEach(callback => {
                  try {
                      callback(payload);
                  } catch (e) {
                      console.error(`Error in subscriber for command '${command}':`, e);
                  }
              });
          }
      }
  }

  public request<T>(command: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
        const requestId = `${command}_${Date.now()}_${Math.random()}`;
        this.pendingRequests.set(requestId, { resolve, reject });

        if (this.vscodeApi) {
            this.vscodeApi.postMessage({ command, payload, requestId });
        } else {
            console.warn(`VS Code API not available. Rejecting request for command: ${command}`);
            setTimeout(() => {
                const mockError = new Error(`VS Code API is not available in a standard browser environment. Command "${command}" was not sent.`);
                this.handleMessage({ command: 'response', requestId, payload: null, error: mockError.message });
            }, 100);
        }
    });
  }
  
  public subscribe(command: string, callback: MessageCallback): () => void {
    if (!this.subscribers.has(command)) {
        this.subscribers.set(command, new Set());
    }
    const commandSubscribers = this.subscribers.get(command)!;
    commandSubscribers.add(callback);

    // Return an unsubscribe function
    return () => {
        commandSubscribers.delete(callback);
        if (commandSubscribers.size === 0) {
            this.subscribers.delete(command);
        }
    };
  }
}

export const vscodeApi = new VscodeApi();
