import axios from 'axios';
import { config } from '../../config';
import { logger, logger as log } from '../../logger';
axios.interceptors.request.use(request => {
  const headers = request.headers;
  let correlationId = null;
  if(headers && headers['x-correlation-id']) {
    correlationId = headers['x-correlation-id'];
  }
  logger.info(`Starting Request for URL ${request.url}, with correlation ID, ${correlationId}`);
  return request;
})

let discovery = null;

async function getOidcDiscovery() {
  if (!discovery) {
    try {
      const response = await axios.get(config.get('oidc:discovery'));
      discovery = response.data;
    } catch (error) {
      log.error('getOidcDiscovery', `OIDC Discovery failed - ${error.message}`);
    }
  }
  return discovery;
}

async function getKeycloakPublicKey() {
  try {
    const response = await axios.get(
      config.get('oidc:keycloakUrl') + '/realms/standard',
    );
    const pubKey = response.data?.public_key;
    if (pubKey) {
      const soamFullPublicKey = `-----BEGIN PUBLIC KEY----- ${pubKey} -----END PUBLIC KEY-----`;
      const newline = '\n';
      return (
        soamFullPublicKey.substring(0, 26) +
        newline +
        soamFullPublicKey.substring(27, 91) +
        newline +
        soamFullPublicKey.substring(91, 155) +
        newline +
        soamFullPublicKey.substring(155, 219) +
        newline +
        soamFullPublicKey.substring(219, 283) +
        newline +
        soamFullPublicKey.substring(283, 346) +
        newline +
        soamFullPublicKey.substring(346, 411) +
        newline +
        soamFullPublicKey.substring(411, 420) +
        newline +
        soamFullPublicKey.substring(420)
      );
    }
  } catch (error) {
    log.error('getOidcDiscovery', `OIDC Discovery failed - ${error.message}`);
    throw error;
  }
}

function getSessionUser(req) {
  return req.session?.passport?.user;
}

async function postDataToDocGenService(body, url, correlationId) {
  const axiosConfig = {
    headers: {
      'x-correlation-id': correlationId,
      'x-api-key': config.get('docGenService:apiKey'),
    },
  };
  return await postData(url, body, axiosConfig);
}
async function postData(url, body, axiosConfig) {
  try {
    const response = await axios.post(url, body, axiosConfig);
    return response.data;
  } catch (error) {
    log.error('postData', `POST failed - ${error.message}`);
    throw error;
  }
}

const utils = {
  getOidcDiscovery,
  prettyStringify: (obj, indent = 2) => JSON.stringify(obj, null, indent),
  getSessionUser,
  getKeycloakPublicKey,
  postDataToDocGenService,
  postData,
};

export { utils };

