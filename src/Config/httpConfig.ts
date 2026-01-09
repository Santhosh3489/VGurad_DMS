import { HttpClient } from '@microsoft/sp-http'; //httpclient instance
import { WebPartContext } from '@microsoft/sp-webpart-base'; //webpart instance

class HttpClientService {
  private static _instance: HttpClientService;
  private _httpClient: HttpClient;
  private static _context: WebPartContext | undefined;

  private constructor() {}

  public static getInstance(): HttpClientService {
    if (!HttpClientService._instance) {
      HttpClientService._instance = new HttpClientService();
    }
    return HttpClientService._instance;
  }

  public setHttpClient(httpClient: HttpClient): void {
    this._httpClient = httpClient;
  }

  public getHttpClient(): HttpClient {
    return this._httpClient;
  }

  public static setContext(context: WebPartContext): void {
    this._context = context;
  }

  public static getContext(): WebPartContext | undefined {
    return this._context;
  }
}

export default HttpClientService;