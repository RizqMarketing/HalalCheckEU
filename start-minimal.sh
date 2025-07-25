#!/bin/bash

# Minimal startup script for halal check testing

echo "🚀 Starting HalalCheck EU - Minimal Setup"

# Copy minimal env
cp .env.minimal .env

# Check if OpenAI API key is set
if grep -q "sk-your-openai-api-key-here" .env; then
    echo "❌ Please add your OpenAI API key to .env file"
    echo "Get it from: https://platform.openai.com/api-keys"
    echo "Replace 'sk-your-openai-api-key-here' with your actual key"
    exit 1
fi

echo "✅ Environment configured"

# Start backend
echo "🔧 Starting backend..."
cd backend
npm install --silent
npm run build
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend running on http://localhost:3001"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm install --silent
npm run build
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 15

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend running on http://localhost:3000"
else
    echo "❌ Frontend failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 HalalCheck EU is ready!"
echo "🌐 Open http://localhost:3000 in your browser"
echo "🧪 Ready to test halal ingredient analysis"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep running
wait