import ClientConnection from './connection';
import { Axios } from 'axios';
import { logger } from '../../../logger';
import retry from 'async-retry';

const SERVICE = 'CHES';
// API DOCS FOR CHES: https://ches.api.gov.bc.ca/api/v1/docs
// https://ches.api.gov.bc.ca/api/v1/docs#tag/Email
export interface Email {
  attachments?: object[];
  bcc?: string[];
  bodyType: string;
  body: string;
  cc?: string[];
  delayTS: number;
  encoding: string;
  from: string;
  priority: string; // 'normal' | 'low' | 'high'.  'normal' is default.
  subject: string;
  to: string[];
}

export class ChesService {
  private readonly connection: ClientConnection;
  private axios: Axios;
  private readonly apiUrl: string;

  constructor({
    tokenUrl,
    clientId,
    clientSecret,
    apiUrl,
    clientConnectionInstance = null,
  }) {
    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      logger.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('ChesService is not configured. Check configuration.');
    }
    if (!clientConnectionInstance) {
      this.connection = new ClientConnection({
        tokenUrl,
        clientId,
        clientSecret,
      });
      this.axios = this.connection.getAxios();
    } else {
      this.axios = clientConnectionInstance.getAxios();
    }

    this.apiUrl = apiUrl;
  }

  async health() {
    try {
      const { data, status } = await this.axios.get(`${this.apiUrl}/health`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return { data, status };
    } catch (e) {
      logger.error(SERVICE, e);
    }
  }

  async send(email: Email) {
    try {
      const { data, status } = await this.axios.post(
        `${this.apiUrl}/email`,
        email,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );
      return { data, status };
    } catch (e) {
      logger.error(e);
      logger.error(SERVICE, e?.config?.data?.errors);
    }
  }

  /**
   * Send an email with retries
   * @param email
   * @param retries , optional , default value 5
   */
  async sendEmailWithRetry(email: Email, retries?: number): Promise<string> {
    const retryCount = retries || 5;
    try {
      await retry(
        async () => {
          const { status } = await this.health();
          if (status === 200) {
            const { data, status } = await this.send(email);
            if (status === 201) {
              logger.info(
                SERVICE,
                `Email sent successfully , transactionId : ${data.txId}`,
              );
              return data.txId;
            } else {
              throw new Error('Error in sending email.');
            }
          } else {
            throw new Error('Error in CHES health check.');
          }
        },
        {
          retries: retryCount,
        },
      );
    } catch (e) {
      logger.error(SERVICE, e);
      return '';
    }
  }

  /**
   * Generate an email object with HTML content. Must provide emailHTMLContent, or, title and body.
   * @param subjectLine SUBJECT of email
   * @param to array of email addresses
   * @param title TITLE of email
   * @param body BODY of email
   * @param emailHTMLContent (Optional) HTML content of email.
   *    If provided, title and body is ignored. Otherwise will use title and body to create HTML content.
   */
  generateHtmlEmail(
    subjectLine: string,
    to: string[],
    title: string,
    body: string,
    emailHTMLContent?: string,
  ): Email {
    const emailContents =
      emailHTMLContent ||
      `<!DOCTYPE html>
            <html lang="en">
              <head>
                <title>${title}</title>
              </head>
              <body>
                ${body}
              </body>
            </html>`;
    return {
      bodyType: 'html',
      body: emailContents,
      delayTS: 0,
      encoding: 'utf-8',
      from: 'no-reply-paytransparency@gov.bc.ca',
      priority: 'normal',
      subject: subjectLine,
      to: to,
    };
  }
}
