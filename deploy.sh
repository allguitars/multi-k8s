docker build -t allguitars/multi-client:latest -t allguitars/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t allguitars/multi-server:latest -t allguitars/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t allguitars/multi-worker:latest -t alltuitars/multi-worker:$SHA -f ./worker/Dockerfile ./worker
docker push allguitars/multi-client:latest
docker push allguitars/multi-server:latest
docker push allguitars/multi-worker:latest

docker push allguitars/multi-client:$SHA
docker push allguitars/multi-server:$SHA
docker push allguitars/multi-worker:$SHA

kubecrtl apply -f k8s
kubectl set image deployment/client-deployment client=allguitars/multi-client:$SHA
kubectl set image deployment/server-deployment server=allguitars/multi-server:$SHA
kubectl set image deployment/worker-deployment worker=allguitars/multi-worker:$SHA
