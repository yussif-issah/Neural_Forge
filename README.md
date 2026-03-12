# Model Compression Agent

A machine learning model compression tool that leverages AI agents to intelligently identify and prune redundant components from neural networks, reducing model size and latency while maintaining performance.

## Overview

This project enables automatic model compression for any model architecture by using an intelligent AI agent that analyzes model components and determines what can be safely pruned. Supported compression techniques include:

- **Neuron Pruning**: Automatically identifies less important neurons in MLP layers using importance scoring
- **Architecture-Agnostic**: Works with any model available on Hugging Face Hub
- **AI-Driven**: Uses CrewAI agents to make intelligent decisions about which components to compress

## Key Features

- 🤖 **AI-Powered Analysis**: Uses AI agents to reason about model structure and importance
- 🎯 **Flexible Pruning**: Supports variable pruning percentages and multiple compression strategies
- 🌐 **Web Interface**: User-friendly web dashboard for model selection and compression configuration
- 📦 **Model-Agnostic**: Works with any architecture (Llama, Gemma, Mistral, etc.)
- ⚡ **Real-time Metrics**: Monitor parameter counts and model size before and after compression

## Project Structure

```
├── web.py                 # FastAPI server & REST endpoints
├── frontend/              # Web interface (HTML, CSS, JavaScript)
├── services/              # Core compression utilities and pruning logic
├── compression_agent/     # AI agent configuration (CrewAI)
│   └── src/              # Agent source code
├── providers/            # Request/response data models
└── utils/                # Helper utilities
```

## Current Status

This project is in early development stage. The foundation for model analysis and basic neuron pruning is established, with the AI agent infrastructure in place for intelligent decision-making.

## What's Next

- Enhanced pruning strategies (layer, attention head, quantization)
- Fine-tuning support to recover performance post-compression
- Benchmarking tools to measure compression effectiveness
- Support for additional model architectures

---
