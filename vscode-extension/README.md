# Son1k-GO! VS Code Extension

This is the companion VS Code extension for the Son1k-GO! web application. It allows the AI assistant to interact directly with your local file system.

## Development

1.  Run `npm install` in this directory (`vscode-extension`) to install dependencies.
2.  Run `npm run watch` to start the TypeScript compiler in watch mode.
3.  Open this `vscode-extension` folder in VS Code and press `F5` to open a new Extension Development Host window with the extension loaded.

## Packaging and Publishing

To package the extension into a `.vsix` file for distribution, you first need to configure your publisher name.

1.  **Create a Publisher Account**: If you don't have one, you need to create a publisher account on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage/publishers/). This gives you a unique publisher ID.

2.  **Update `package.json`**: Open the `package.json` file in this directory.
    - Find the `"publisher"` field.
    - Replace the placeholder value `"your-publisher-name"` with your actual publisher ID from the Marketplace.

3.  **Package the Extension**: Run the following command in your terminal from this directory:
    ```bash
    npm run package
    ```
    This command uses `vsce` to create a `son1k-go-x.x.x.vsix` file. This file can be shared and installed manually in VS Code by running `code --install-extension son1k-go-x.x.x.vsix` from the command line.
