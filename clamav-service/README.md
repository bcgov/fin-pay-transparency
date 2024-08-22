### OpenShift Deployment 
1. Due to the resource intensive nature of the clamav-service, it is recommended to deploy the clamav-service ,it is deployed to tools namespace
on OpenShift project from the rest of the application.
2. Applications will interact with the clamav-service via K8S service with explicit KNPs allowing internal traffic.
3. the API_KEY will be provided by GitHub Secrets which will also feed into admin-frontend(caddy) to call to this node api
