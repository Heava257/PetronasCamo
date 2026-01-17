#!/bin/bash

# Function to handle termination
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting POS System..."

# Start Backend
echo "Starting Backend API (api-pos-nit)..."
cd api-pos-nit
npm install
npm start &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend UI (web-pos-nit)..."
cd ../web-pos-nit
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ All services are running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Keep the script running
wait
