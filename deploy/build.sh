#!/bin/bash
set -e

if [ -f .env ]; then
  source .env
fi

DOCKER_REGISTRY=${DOCKER_REGISTRY:-"webdev0594"}
IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short HEAD)}

echo "Building image: ${DOCKER_REGISTRY}/chatalgo:${IMAGE_TAG}"

docker buildx build --platform linux/amd64,linux/arm64 -t ${DOCKER_REGISTRY}/chatalgo:${IMAGE_TAG} --push .

echo "Image successfully built and pushed: ${DOCKER_REGISTRY}/chatalgo:${IMAGE_TAG}"

echo "Generating deployment manifest..."
cat deploy/deployment.yaml | \
  sed "s|\${DOCKER_REGISTRY}|${DOCKER_REGISTRY}|g" | \
  sed "s|\${IMAGE_TAG}|${IMAGE_TAG}|g" > deploy/deployment-ready.yaml

echo "Deployment manifest generated: deploy/deployment-ready.yaml"
echo "Done!"
