const request = require('supertest');
const ApiGhost = require('../src/index');
const fs = require('fs').promises;
const path = require('path');

describe('API Ghost', () => {
  let ghost;
  let testSpecPath;

  beforeAll(async () => {
    // Create a test spec file
    testSpecPath = path.join(__dirname, 'test-spec.json');
    const testSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {
        '/items': {
          get: {
            summary: 'List items',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create item',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: { type: 'string' }
                    }
                  }
                }
              }
            },
            responses: {
              '201': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/items/{id}': {
          get: {
            summary: 'Get item by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer' }
              }
            ],
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
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
    // Cleanup
    if (ghost && ghost.server) {
      ghost.server.close();
    }
    try {
      await fs.unlink(testSpecPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  describe('Basic Mock Mode (no LLM)', () => {
    beforeAll(async () => {
      ghost = new ApiGhost({
        specPath: testSpecPath,
        port: 0, // Use random port
        useLLM: false
      });
      await ghost.generate();
    });

    test('should start server and handle GET /items', async () => {
      const response = await request(ghost.app)
        .get('/items')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
      }
    });

    test('should handle GET /items/{id}', async () => {
      const response = await request(ghost.app)
        .get('/items/1')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });

    test('should handle POST /items', async () => {
      const response = await request(ghost.app)
        .post('/items')
        .send({ name: 'Test Item' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('Spec Loading', () => {
    test('should throw error for non-existent file', async () => {
      const badGhost = new ApiGhost({
        specPath: '/non/existent/file.json',
        port: 0
      });

      await expect(badGhost.generate()).rejects.toThrow();
    });

    test('should throw error for invalid JSON', async () => {
      const badSpecPath = path.join(__dirname, 'bad-spec.json');
      await fs.writeFile(badSpecPath, 'invalid json');

      const badGhost = new ApiGhost({
        specPath: badSpecPath,
        port: 0
      });

      await expect(badGhost.generate()).rejects.toThrow();

      await fs.unlink(badSpecPath);
    });
  });

  describe('Basic Mock Data Generation', () => {
    test('should generate basic mock data for strings', () => {
      const result = ghost.generateBasicMockData({ type: 'string' });
      expect(result).toBe('sample string');
    });

    test('should generate basic mock data for emails', () => {
      const result = ghost.generateBasicMockData({
        type: 'string',
        format: 'email'
      });
      expect(result).toBe('user@example.com');
    });

    test('should generate basic mock data for integers', () => {
      const result = ghost.generateBasicMockData({ type: 'integer' });
      expect(typeof result).toBe('number');
    });

    test('should generate basic mock data for booleans', () => {
      const result = ghost.generateBasicMockData({ type: 'boolean' });
      expect(typeof result).toBe('boolean');
    });

    test('should generate basic mock data for objects', () => {
      const result = ghost.generateBasicMockData({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' }
        }
      });
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
    });

    test('should generate basic mock data for arrays', () => {
      const result = ghost.generateBasicMockData({
        type: 'array',
        items: { type: 'string' }
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
