#!/bin/bash

# Demo script for api-ghost

echo "👻 API Ghost Demo"
echo "=================="
echo ""

# Demo 1: Show help
echo "1. Show CLI help:"
echo "$ api-ghost --help"
api-ghost --help
echo ""

# Demo 2: Generate server to disk
echo "2. Generate mock server to disk (without LLM):"
echo "$ api-ghost -s examples/petstore.json -o ./demo-server --no-llm"
api-ghost -s examples/petstore.json -o ./demo-server --no-llm
echo ""

# Demo 3: Show generated files
echo "3. Generated files:"
ls -lh demo-server/
echo ""

# Demo 4: Show server code
echo "4. Generated server.js (first 20 lines):"
head -20 demo-server/server.js
echo ""

# Demo 5: Clean up
echo "5. Cleanup demo files:"
rm -rf demo-server
echo "✓ Cleanup complete"
echo ""

echo "Demo finished! 🎉"
echo ""
echo "To run a live server, use:"
echo "  api-ghost -s examples/petstore.json -p 3001 --no-llm"
