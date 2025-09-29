#!/bin/bash

# Snake Game Startup Script
echo "🐍 Starting Snake Game..."

# Check if npm is available and live-server is installed
if command -v npm &> /dev/null && npm list live-server &> /dev/null; then
    echo "Using live-server (recommended)..."
    npm start
elif command -v python3 &> /dev/null; then
    echo "Using Python HTTP server..."
    echo "Game will be available at: http://localhost:8080"
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Using Python 2 HTTP server..."
    echo "Game will be available at: http://localhost:8080"
    python -m SimpleHTTPServer 8080
else
    echo "❌ No suitable HTTP server found."
    echo "Please install Node.js with npm or Python to run the game."
    echo "Or simply open index.html in your web browser."
    exit 1
fi