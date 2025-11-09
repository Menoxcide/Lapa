#!/bin/bash
# One-click NIM setup (Docker)

set -e

echo "Installing NVIDIA NIM via Docker..."
docker pull nvcr.io/nim:latest || echo "Pull failed – check NVIDIA NGC"

echo "NIM ready. Run: docker run -p 8000:8000 nvcr.io/nim:latest"