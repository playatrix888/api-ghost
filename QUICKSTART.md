# Quick Start Guide

## Installation

```bash
# From npm (when published)
npm install -g api-ghost

# Or from source
git clone <repo-url>
cd api-ghost
npm install
npm link
```

## Basic Usage

### 1. Run a mock server immediately

```bash
api-ghost -s path/to/openapi.json
```

Server starts at http://localhost:3000

### 2. Use custom port

```bash
api-ghost -s path/to/openapi.json -p 8080
```

### 3. Generate server code to disk

```bash
api-ghost -s path/to/openapi.json -o ./mock-server
cd mock-server
npm install
npm start
```

### 4. Without LLM (no API key needed)

```bash
api-ghost -s path/to/openapi.json --no-llm
```

## Setup OpenAI API Key (Optional)

For realistic mock data:

```bash
export OPENAI_API_KEY=your_key_here
```

Or create `.env` file:
```
OPENAI_API_KEY=your_key_here
```

## Testing with Example Specs

```bash
# Pet Store API
api-ghost -s examples/petstore.json -p 3001

# Users API
api-ghost -s examples/users.json -p 3002
```

Then test endpoints:
```bash
curl http://localhost:3001/pets
curl http://localhost:3001/pets/1

curl http://localhost:3002/users
curl http://localhost:3002/users/123e4567-e89b-12d3-a456-426614174000
```

## Run Tests

```bash
npm test
```

## Run Demo

```bash
./demo.sh
```

## What Gets Generated

When using `-o output-dir`:

```
output-dir/
├── server.js          # Express server with mocked routes
├── package.json       # Dependencies
├── .env.example       # Environment variables template
└── openapi.json       # Copy of your spec
```

## Common Use Cases

1. **Frontend Development**: Mock backend while it's being built
2. **Testing**: Create predictable test servers
3. **Documentation**: Verify OpenAPI specs work as expected
4. **Prototyping**: Quickly spin up APIs for demos
5. **Contract Testing**: Test against real-looking data

## Tips

- Use `--no-llm` for faster startup without API keys
- Path parameters work automatically (`{id}` → `:id`)
- Array endpoints detected automatically
- CORS enabled by default
- Responses cached for consistency
