const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

describe('CLI', () => {
  let testSpecPath;

  beforeAll(async () => {
    // Create a minimal test spec
    testSpecPath = path.join(__dirname, 'cli-test-spec.json');
    const testSpec = {
      openapi: '3.0.0',
      info: { title: 'CLI Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    await fs.writeFile(testSpecPath, JSON.stringify(testSpec, null, 2));
  });

  afterAll(async () => {
    try {
      await fs.unlink(testSpecPath);
    } catch (e) {
      // Ignore
    }
  });

  test('should show version', (done) => {
    exec('node cli.js --version', (error, stdout, stderr) => {
      expect(stdout).toContain('1.0.0');
      done();
    });
  });

  test('should show help', (done) => {
    exec('node cli.js --help', (error, stdout, stderr) => {
      expect(stdout).toContain('api-ghost');
      expect(stdout).toContain('--spec');
      expect(stdout).toContain('--port');
      expect(stdout).toContain('--output');
      done();
    });
  });

  test('should generate server to output directory', (done) => {
    const outputDir = path.join(__dirname, 'cli-output');
    const cmd = `node cli.js -s ${testSpecPath} -o ${outputDir} --no-llm`;

    exec(cmd, async (error, stdout, stderr) => {
      expect(error).toBeNull();

      // Check that output directory was created
      const stat = await fs.stat(outputDir);
      expect(stat.isDirectory()).toBe(true);

      // Check that files were generated
      const files = await fs.readdir(outputDir);
      expect(files).toContain('server.js');
      expect(files).toContain('package.json');
      expect(files).toContain('.env.example');
      expect(files).toContain('openapi.json');

      // Cleanup
      await fs.rm(outputDir, { recursive: true, force: true });

      done();
    });
  });
});
