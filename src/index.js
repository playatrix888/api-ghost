const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

class ApiGhost {
  constructor(options) {
    this.specPath = options.specPath;
    this.port = options.port;
    this.outputDir = options.outputDir;
    this.useLLM = options.useLLM !== false && process.env.OPENAI_API_KEY;
    this.openai = this.useLLM ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.spec = null;
    this.app = express();
    this.mockDataCache = {};
  }

  async generate() {
    // Load spec
    await this.loadSpec();

    // Setup Express app
    this.setupExpress();

    // Generate routes
    await this.generateRoutes();

    if (this.outputDir) {
      await this.writeToDisk();
    } else {
      this.startServer();
    }
  }

  async loadSpec() {
    try {
      const content = await fs.readFile(this.specPath, 'utf-8');
      this.spec = JSON.parse(content);
      console.log(`✓ Loaded OpenAPI spec with ${Object.keys(this.spec.paths || {}).length} paths`);
    } catch (error) {
      throw new Error(`Failed to load spec: ${error.message}`);
    }
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  async generateRoutes() {
    if (!this.spec.paths) {
      console.log('⚠ No paths found in spec');
      return;
    }

    for (const [routePath, methods] of Object.entries(this.spec.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          await this.createRoute(routePath, method, details);
        }
      }
    }
  }

  async createRoute(routePath, method, details) {
    // Convert OpenAPI path params {param} to Express params :param
    const expressPath = routePath.replace(/\{([^}]+)\}/g, ':$1');
    const pathKey = `${method.toUpperCase()} ${routePath}`;
    const responseSchema = details.responses?.['200']?.content?.['application/json']?.schema || details.responses?.['201']?.content?.['application/json']?.schema;
    const summary = details.summary || details.description || pathKey;

    console.log(`  ${method.toUpperCase().padEnd(6)} ${routePath}`);

    // Mock handler
    const handler = async (req, res) => {
      try {
        let data;

        if (this.useLLM && responseSchema) {
          data = await this.generateMockDataWithLLM(summary, responseSchema, req.params, req.query, req.body);
        } else {
          data = this.generateBasicMockData(responseSchema);
        }

        // Handle array responses - only for list endpoints or explicit array type
        if (responseSchema?.type === 'array') {
          if (!Array.isArray(data)) {
            data = [data];
          }
        }

        res.json(data);
      } catch (error) {
        console.error(`Error in ${pathKey}:`, error.message);
        res.status(500).json({ error: 'Internal server error' });
      }
    };

    // Register route with Express
    switch (method) {
      case 'get':
        this.app.get(expressPath, handler);
        break;
      case 'post':
        this.app.post(expressPath, handler);
        break;
      case 'put':
        this.app.put(expressPath, handler);
        break;
      case 'patch':
        this.app.patch(expressPath, handler);
        break;
      case 'delete':
        this.app.delete(expressPath, handler);
        break;
    }
  }

  async generateMockDataWithLLM(summary, schema, params = {}, query = {}, body = {}) {
    const cacheKey = `${summary}-${JSON.stringify(schema)}`;

    if (this.mockDataCache[cacheKey]) {
      return this.mockDataCache[cacheKey];
    }

    try {
      const prompt = `Generate realistic mock data for this API endpoint:
Summary: ${summary}
Schema: ${JSON.stringify(schema, null, 2)}

Return ONLY valid JSON that matches the schema. No explanations, no markdown code blocks.
Use realistic data - real-looking names, emails, dates, numbers appropriate for the context.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You generate realistic mock data for API responses. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const content = completion.choices[0].message.content.trim();
      const data = JSON.parse(content);

      this.mockDataCache[cacheKey] = data;
      return data;
    } catch (error) {
      console.warn(`LLM generation failed for ${summary}, using basic mock: ${error.message}`);
      return this.generateBasicMockData(schema);
    }
  }

  generateBasicMockData(schema) {
    if (!schema) {
      return { message: 'Success' };
    }

    if (schema.type === 'object' && schema.properties) {
      const obj = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        obj[key] = this.generateBasicMockData(prop);
      }
      return obj;
    }

    if (schema.type === 'array') {
      return [this.generateBasicMockData(schema.items || {})];
    }

    if (schema.type === 'string') {
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date') return '2024-01-01';
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (schema.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
      return 'sample string';
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.format === 'float') return 42.5;
      return 42;
    }

    if (schema.type === 'boolean') {
      return true;
    }

    return null;
  }

  startServer() {
    this.server = this.app.listen(this.port, () => {
      console.log(`\n👻 Mock API server ready!\n`);
    });

    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        throw new Error(`Port ${this.port} is already in use`);
      }
      throw error;
    });
  }

  async writeToDisk() {
    if (!this.outputDir) return;

    await fs.mkdir(this.outputDir, { recursive: true });

    // Write server file
    const serverCode = this.generateServerCode();
    await fs.writeFile(path.join(this.outputDir, 'server.js'), serverCode);

    // Write package.json
    const packageJson = {
      name: 'api-ghost-mock',
      version: '1.0.0',
      description: 'Auto-generated mock API server',
      main: 'server.js',
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5',
        dotenv: '^16.0.0',
        openai: '^4.0.0'
      }
    };
    await fs.writeFile(
      path.join(this.outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Write .env.example
    await fs.writeFile(
      path.join(this.outputDir, '.env.example'),
      'OPENAI_API_KEY=your_key_here\n'
    );

    // Copy spec file
    await fs.copyFile(this.specPath, path.join(this.outputDir, 'openapi.json'));
  }

  generateServerCode() {
    return `// Auto-generated by api-ghost
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || ${this.port};

app.use(cors());
app.use(express.json());

// Routes would be generated here based on the spec
// This is a simplified version for demonstration

app.get('/', (req, res) => {
  res.json({ message: 'Mock API Server' });
});

app.listen(PORT, () => {
  console.log(\`Mock server running on port \${PORT}\`);
});
`;
  }
}

module.exports = ApiGhost;
