#!/bin/bash
# SOULVERSE AGENT PLATFORM - Startup Script
# Launches the game, agent server, and payment processor

echo "🌌 SOULVERSE AGENT PLATFORM"
echo "=========================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7+"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if aiohttp is installed
if ! python3 -c "import aiohttp" &> /dev/null; then
    echo "⚠️  Installing aiohttp..."
    pip3 install aiohttp
fi

echo "✅ aiohttp installed"

# Check if Ollama is running
if command -v ollama &> /dev/null; then
    if ! pgrep -f "ollama serve" > /dev/null; then
        echo "🔄 Starting Ollama server..."
        ollama serve &
        sleep 3
    else
        echo "✅ Ollama server already running"
    fi
    
    # Check if model is installed
    if ollama list | grep -q "qwen2.5"; then
        echo "✅ qwen2.5 model found"
    else
        echo "⚠️  Pulling qwen2.5:0.5b model (this may take a few minutes)..."
        ollama pull qwen2.5:0.5b
    fi
else
    echo "⚠️  Ollama not installed. Install with: curl -fsSL https://ollama.com/install.sh | sh"
    echo "   Agents will use external APIs (OpenAI, Anthropic) instead"
fi

echo ""
echo "📁 Working directory: $(pwd)"
echo ""

# Create state directory
mkdir -p ~/soulverse

# Start Agent Platform Server
echo "🚀 Starting Agent Platform Server on port 8765..."
python3 agent-platform-server.py &
AGENT_PID=$!
sleep 2

# Start Payment Processor
echo "💰 Starting Payment Processor on port 8766..."
python3 payment-processor.py &
PAYMENT_PID=$!
sleep 2

# Check if servers started successfully
if ps -p $AGENT_PID > /dev/null && ps -p $PAYMENT_PID > /dev/null; then
    echo ""
    echo "✅ All services started successfully!"
    echo ""
    echo "📱 Open in your browser:"
    echo "   http://localhost:8765"
    echo ""
    echo "🎮 Or open the HTML file directly:"
    echo "   file://$(pwd)/SOULVERSE-AGENT-MARKETPLACE.html"
    echo ""
    echo "📊 Server Status:"
    echo "   - Agent Platform: http://localhost:8765/api/health"
    echo "   - Payment Processor: http://localhost:8766"
    echo ""
    echo "🛑 To stop all services, press Ctrl+C or run:"
    echo "   kill $AGENT_PID $PAYMENT_PID"
    echo ""
    echo "=========================="
    echo "SOULVERSE IS READY! 🌌"
    echo "=========================="
    
    # Keep script running
    wait
else
    echo "❌ Failed to start services"
    echo "Check logs for errors"
    exit 1
fi
