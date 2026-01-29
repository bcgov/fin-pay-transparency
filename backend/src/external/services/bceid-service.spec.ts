import { getCompanyDetails } from './bceid-service.js';
import soapRequest from 'easy-soap-request';
import { config } from '../../config/config.js';

jest.mock('easy-soap-request'); // Mock the soapRequest function
jest.mock('../../config/config'); // Mock the config module

// Define a mock response for the soapRequest function
const mockSoapResponse = {
  response: {
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
 <soap:Header/>
 <soap:Body>
    <getAccountDetailResponse xmlns="http://www.bceid.ca/webservices/Client/V10/">
       <getAccountDetailResult>
          <code>Success</code>
          <account>
            <business>
              <legalName>
                <value>Test Company</value>
              </legalName>
              <address>
                <addressLine1>
                  <value>123 Main St</value>
                </addressLine1>
                <addressLine2>
                  <value>Suite 456</value>
                </addressLine2>
                <city>
                  <value>City</value>
                </city>
                <province>
                  <value>Province</value>
                </province>
                <country>
                  <value>Country</value>
                </country>
              </address>
            </business>
          </account>
       </getAccountDetailResult>
    </getAccountDetailResponse>
 </soap:Body>
</soap:Envelope>`,
    statusCode: 200,
  },
};

describe('getCompanyDetails', () => {
  afterAll(() => {
    config.get.mockRestore();
  });

  it('should return company details on successful SOAP request', async () => {
    // Mock the soapRequest function to return the defined response
    soapRequest.mockResolvedValue(mockSoapResponse);

    // Call the function you want to test
    const userGuid = 'testUserGuid';
    const companyDetails = await getCompanyDetails(
      userGuid,
      'dGVzdFVzZXJuYW1lOnRlc3RQYXNzd29yZA==',
      'https://example.com/soap-service',
      '<getAccountDetail xmlns="http://www.bceid.ca/webservices/Client/V10/">',
    );

    // Assertions
    expect(companyDetails).toEqual({
      legalName: 'Test Company',
      addressLine1: '123 Main St',
      addressLine2: 'Suite 456',
      city: 'City',
      province: 'Province',
      country: 'Country',
    });
    // Ensure soapRequest was called with the expected arguments
    expect(soapRequest).toHaveBeenCalledWith({
      url: 'https://example.com/soap-service',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        authorization: 'Basic dGVzdFVzZXJuYW1lOnRlc3RQYXNzd29yZA==',
      },
      xml: expect.stringContaining(
        '<getAccountDetail xmlns="http://www.bceid.ca/webservices/Client/V10/">',
      ),
      timeout: 10000,
    });
  });

  it('should throw an error on SOAP request failure', async () => {
    // Mock the soapRequest function to return an error response
    soapRequest.mockRejectedValue(new Error('SOAP request failed'));

    // Call the function you want to test and expect it to throw an error
    const userGuid = 'testUserGuid';
    await expect(getCompanyDetails(userGuid)).rejects.toThrow(
      'SOAP request failed',
    );
  });
});
