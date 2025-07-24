# Project Title: Git-AI Markdown Editor

## Overview

The Git-AI Markdown Editor is a web-based platform designed to simplify the process of editing Markdown documents stored in a Git repository. With the integration of Anthropic's Claude AI, users can receive AI-powered writing assistance directly within the editor. This project aims to make documentation and knowledge management more accessible and efficient, particularly for teams that utilize Git for version control.

## Getting Started

### Prerequisites

- GitHub Personal Access Token (PAT)
- Claude API Key

### Setup

1. **Clone the Repository**

```bash
git clone https://github.com/<your-repo>/git-ai-markdown-editor.git
cd git-ai-markdown-editor
```

2. **Configuration**

Edit the `.env` file to include your GitHub PAT and Claude API Key.

3. **Installation**

```bash
npm install
```

4. **Run the Application**

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Deployment

The project is containerized using Docker, making it easy to deploy on any platform that supports Docker containers.

### Building the Docker Image

```bash
docker build -t git-ai-markdown-editor .
```

### Running the Container

```bash
docker run -p 3000:3000 git-ai-markdown-editor
```

Visit `http://localhost:3000` to access the application.

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the [MIT License](LICENSE).

## Features

- **GitHub Integration**: Authenticate and interact with GitHub repositories directly.
- **Markdown Editing**: Live editing of `.md` files with preview capabilities.
- **AI Assistance**: Get writing suggestions, summarizations, and more from the Claude AI.
- **Easy Committing**: Stage, commit, and push changes back to the repository without leaving the browser.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
