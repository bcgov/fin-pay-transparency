### OpenShift Deployment
1. Due to the resource intensive nature of the clamav-service, it is recommended to deploy the clamav-service ,it is deployed to tools namespace
   on OpenShift project from the rest of the application.
2. Applications will interact with the clamav-service via K8S service with explicit KNPs allowing internal traffic.
3. the API_KEY will be provided by GitHub Secrets which will also feed into admin-frontend(caddy) to call to this node api

### Local Development
1. Run clamav container using podman or docker
    1. `docker/podman run -p 3310:3310 clamav/clamav`
2. Run clamav node api which will start the api on port `3003`
3. All the port mappings are described in main [README.md](../README.md)
