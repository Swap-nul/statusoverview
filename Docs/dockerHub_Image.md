docker login -u swapnil512
docker build -t swapnil512/statusoverview-ui:1.0.0 .
docker build -t swapnil512/statusoverview-db:1.0.0 ./database
docker push swapnil512/statusoverview-ui:1.0.0
docker push swapnil512/statusoverview-db:1.0.0




## Building for multiarch:

docker buildx create --use --name multiarch-builder
docker buildx inspect --bootstrap

docker buildx build --platform linux/amd64,linux/arm64 -t swapnil512/statusoverview-ui:1.0.0 --push .
docker buildx build --platform linux/amd64,linux/arm64 -t swapnil512/statusoverview-db:1.0.0 --push ./database
