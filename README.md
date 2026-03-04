# 👻 API Ghost

A CLI that automatically generates a mock API server (with Express) from any OpenAPI/Swagger JSON file, using an LLM to generate realistic mock data for endpoints.

## Features

- 📄 **Parse OpenAPI/Swagger JSON**: Works with any valid OpenAPI 3.0 spec
- 🤖 **LLM-Powered Mock Data**: Uses OpenAI GPT to generate realistic, context-aware mock data
- 🚀 **Instant Server**: Run a mock server in seconds
- 💾 **Generate to Disk**: Export the server code for customization
- 🎭 **Basic Mock Mode**: Works without API keys using simple mock data
- 🔧 **Express-Based**: Clean, standard Express server under the hood

## Installation

```bash
npm install -g api-ghost
```

Or clone and run locally:

```bash
git clone <repo-url>
cd api-ghost
npm install
npm link
```

## Usage

### Basic Usage (Run Server)

```bash
api-ghost -s path/to/openapi.json
```

This starts the mock server on port 3000 by default.

### Specify Port

```bash
api-ghost -s path/to/openapi.json -p 8080
```

### Generate to Disk

```bash
api-ghost -s path/to/openapi.json -o ./mock-server
```

This creates a complete Express server in `./mock-server` that you can customize and run.

### Without LLM (Basic Mock Data)

```bash
api-ghost -s path/to/openapi.json --no-llm
```

Use this mode if you don't have an OpenAI API key or want faster responses.

## Setup

### Get OpenAI API Key (Optional but Recommended)

For realistic mock data generation:

1. Go to https://platform.openai.com/api-keys
2. Create an API key
3. Set it as an environment variable:

```bash
export OPENAI_API_KEY=your_key_here
```

Or create a `.env` file in your working directory:

```
OPENAI_API_KEY=your_key_here
```

## Examples

### Example 1: Pet Store API

```bash
api-ghost -s examples/petstore.json
```

Then test the endpoints:

```bash
curl http://localhost:3000/pets
curl http://localhost:3000/pets/1
```

### Example 2: Users API

```bash
api-ghost -s examples/users.json -p 4000
```

```bash
curl http://localhost:4000/users
curl http://localhost:4000/users/123e4567-e89b-12d3-a456-426614174000
```

### Example 3: Generate Custom Server

```bash
api-ghost -s examples/petstore.json -o ./my-mock-api
cd my-mock-api
npm install
npm start
```

## How It Works

1. **Parse**: Reads the OpenAPI/Swagger JSON file
2. **Analyze**: Extracts all paths, methods, and response schemas
3. **Generate**:
   - With LLM: Sends schema to GPT to generate realistic data based on context
   - Without LLM: Uses sensible defaults for common types (email, UUID, dates, etc.)
4. **Serve**: Creates Express routes that return the generated data
5. **Cache**: Reuses generated data for consistent responses

## Mock Data Examples

### With LLM (Realistic)

```json
{
  "id": 42,
  "name": "Bella the Golden Retriever",
  "tag": "friendly"
}
```

### Without LLM (Basic)

```json
{
  "id": 42,
  "name": "sample string",
  "tag": "sample string"
}
```

## CLI Options

```
Options:
  -V, --version              output the version number
  -s, --spec <path>          Path to OpenAPI/Swagger JSON file (required)
  -p, --port <number>        Port to run the mock server on (default: 3000)
  -o, --output <path>        Output directory for generated server (optional)
  --no-llm                   Use basic mock data instead of LLM generation
  -h, --help                 display help for command
```

## Development

### Run Tests

```bash
npm test
```

### Project Structure

```
api-ghost/
├── cli.js              # CLI entry point
├── src/
│   └── index.js        # Core API Ghost class
├── examples/           # Example OpenAPI specs
│   ├── petstore.json
│   └── users.json
├── package.json
└── README.md
```

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or PRs.

## Why API Ghost?

- **Frontend Development**: Mock APIs while backend is being built
- **Testing**: Create predictable test servers
- **Documentation**: Verify OpenAPI specs work as expected
- **Prototyping**: Quickly spin up APIs for demos
- **Contract Testing**: Test against real-looking data
