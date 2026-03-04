#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const ApiGhost = require('./src/index');

const program = new Command();

program
  .name('api-ghost')
  .description('Generate a mock API server from OpenAPI/Swagger JSON using LLM-powered data')
  .version('1.0.0')
  .requiredOption('-s, --spec <path>', 'Path to OpenAPI/Swagger JSON file')
  .option('-p, --port <number>', 'Port to run the mock server on', '3000')
  .option('-o, --output <path>', 'Output directory for generated server (optional)')
  .option('--no-llm', 'Use basic mock data instead of LLM generation')
  .action(async (options) => {
    try {
      const specPath = path.resolve(process.cwd(), options.spec);
      const outputDir = options.output ? path.resolve(process.cwd(), options.output) : null;

      console.log('👻 API Ghost starting...');
      console.log(`📄 Loading spec: ${specPath}`);
      console.log(`🚀 Port: ${options.port}`);

      const ghost = new ApiGhost({
        specPath,
        port: parseInt(options.port),
        outputDir,
        useLLM: options.llm
      });

      await ghost.generate();

      if (outputDir) {
        console.log(`✅ Generated mock server at: ${outputDir}`);
      } else {
        console.log(`✅ Mock server running at http://localhost:${options.port}`);
        console.log('Press Ctrl+C to stop');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
