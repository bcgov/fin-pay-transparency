import soapRequest from 'easy-soap-request';
import { parseString } from 'xml2js';
import get from 'lodash/get.js';
import { promisify } from 'util';
import { config } from '../../config/config.js';
import { logger } from '../../logger.js';

const basic_auth =
  config.get('bceidWsIntegration:auth:username') +
  ':' +
  config.get('bceidWsIntegration:auth:password');
const base64BasicAuthVal = Buffer.from(basic_auth).toString('base64');
const onlineServiceId = config.get('bceidWsIntegration:onlineServiceId');
const parseStringSync = promisify(parseString);

const serviceUrl = config.get('bceidWsIntegration:url');

const generateXML = (
  userGuid: string,
  onlineServiceID: string = onlineServiceId,
) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Header/>
 <soapenv:Body>
    <getAccountDetail xmlns="http://www.bceid.ca/webservices/Client/V10/">
       <accountDetailRequest>
          <onlineServiceId>${onlineServiceID}</onlineServiceId>
          <requesterAccountTypeCode>Business</requesterAccountTypeCode>
          <requesterUserGuid>${userGuid}</requesterUserGuid>
          <userGuid>${userGuid}</userGuid>
          <accountTypeCode>Business</accountTypeCode>
       </accountDetailRequest>
    </getAccountDetail>
 </soapenv:Body>
</soapenv:Envelope>`;

const getCompanyDetails = async (
  userGuid: string,
  base64BasicAuth: string = base64BasicAuthVal,
  serviceURL: string = serviceUrl,
  xml: string = generateXML(userGuid),
) => {
  const defaultHeaders = {
    'Content-Type': 'text/xml;charset=UTF-8',
    authorization: `Basic ${base64BasicAuth}`,
  };

  logger.silly(xml);
  logger.silly(serviceURL);
  logger.silly(defaultHeaders);
  const { response }: any = await soapRequest({
    url: serviceURL,
    headers: defaultHeaders,
    xml,
    timeout: 10000,
  });

  const { headers, body, statusCode } = response;
  const result = await parseStringSync(body);
  const data = get(
    result,
    'soap:Envelope.soap:Body.0.getAccountDetailResponse.0.getAccountDetailResult.0',
  );
  if (!data) throw Error('no data');

  const status = get(data, 'code.0');
  if (status === 'Failed') {
    const failureCode = get(data, 'failureCode.0');
    const message = get(data, 'message.0');
    throw Error(`${failureCode}: ${message}`);
  }

  const account = get(data, 'account.0');
  const business = get(account, 'business.0');
  const legalName = get(business, 'legalName.0.value.0');
  const address = get(business, 'address.0');
  const addressLine1 = get(address, 'addressLine1.0.value.0');
  const addressLine2 = get(address, 'addressLine2.0.value.0');
  const city = get(address, 'city.0.value.0');
  const province = get(address, 'province.0.value.0');
  const country = get(address, 'country.0.value.0');
  const postal = get(address, 'postal.0.value.0');
  const companyDetails = {
    legalName,
    addressLine1,
    addressLine2,
    city,
    province,
    country,
    postal,
  };
  logger.silly(companyDetails);
  return companyDetails;
};
export { getCompanyDetails };
