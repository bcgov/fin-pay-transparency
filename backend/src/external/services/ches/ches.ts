import { ChesService } from './ches-service.js';
import { config } from '../../../config/config.js';
let emailService: ChesService;
if (config.get('ches:enabled')) {
  emailService = new ChesService({
    tokenUrl: config.get('ches:tokenUrl'),
    clientId: config.get('ches:clientId'),
    clientSecret: config.get('ches:clientSecret'),
    apiUrl: config.get('ches:apiUrl'),
  });
}
export default emailService;
