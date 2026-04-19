docker login -u swapnil512
docker build -t swapnil512/statusoverview-ui:1.0.0 .
docker build -t swapnil512/statusoverview-db:1.0.0 ./database
docker push swapnil512/statusoverview-ui:1.0.0
docker push swapnil512/statusoverview-db:1.0.0
