import https from 'https';
import fetch from 'node-fetch';

export class HeaterApiClient {
  constructor(
    private baseUrl: string,
    private authHeader: string,
    private timeout: number
  ) {}

  async request(method: string, endpoint: string, data: any = null): Promise<any> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const agent = new https.Agent({ rejectUnauthorized: false });
    const options: any = {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'StoneConnect-Node-Client/1.0',
      },
      timeout: this.timeout,
      agent,
    };
    if (data) options.body = JSON.stringify(data);
    let res;
    try {
      res = await fetch(url, options);
    } catch (err: any) {
      throw new Error(`Connection failed: ${err.message}`);
    }
    if (res.status === 401) throw new Error('Authentication failed');
    if (res.status === 404) throw new Error(`Endpoint not found: ${endpoint}`);
    if (!res.ok) throw new Error(`API request failed: ${res.status} - ${await res.text()}`);
    try {
      return await res.json();
    } catch {
      const text = await res.text();
      return text ? { response: text } : {};
    }
  }
}
