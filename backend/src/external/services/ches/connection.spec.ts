import ClientConnection from './connection.js';

describe('ClientConnection', () => {
  let clientConnection: ClientConnection;

  beforeEach(() => {
    clientConnection = new ClientConnection({
      tokenUrl: 'https://example.com/token',
      clientId: 'yourClientId',
      clientSecret: 'yourClientSecret',
    });
  });

  it('should create an instance of ClientConnection', () => {
    expect(clientConnection).toBeInstanceOf(ClientConnection);
  });

  it('should return an instance of axios', () => {
    const axiosInstance = clientConnection.getAxios();
    expect(axiosInstance).toBeTruthy();
  });
});
