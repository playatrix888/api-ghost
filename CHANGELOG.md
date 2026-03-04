# Changelog

## [1.0.0] - 2026-03-03

### Added
- Initial release of API Ghost
- OpenAPI/Swagger JSON parsing
- Express-based mock server generation
- LLM-powered realistic mock data via OpenAI GPT
- Basic mock data mode (no API key required)
- CLI with options for port, output directory, and LLM mode
- Automatic path parameter conversion (`{param}` to `:param`)
- Full test suite with Jest and Supertest
- Example specs (Pet Store and Users API)
- Comprehensive README documentation

### Features
- Run mock server instantly from any OpenAPI spec
- Generate server code to disk for customization
- Automatic detection of array responses
- CORS enabled by default
- Support for GET, POST, PUT, PATCH, DELETE methods
- Mock data caching for consistent responses
