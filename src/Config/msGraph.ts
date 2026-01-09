import { MSGraphClientV3 } from '@microsoft/sp-http';

class MSGraphClientService {
  private static _instance: MSGraphClientService;
  private _graphClient: MSGraphClientV3;
  private _isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): MSGraphClientService {
    if (!MSGraphClientService._instance) {
      MSGraphClientService._instance = new MSGraphClientService();
    }
    return MSGraphClientService._instance;
  }

  public setGraphClient(graphClient: MSGraphClientV3): void {
    this._graphClient = graphClient;
    this._isInitialized = true;
  }

  public getGraphClient(): MSGraphClientV3 {
    if (!this._isInitialized || !this._graphClient) {
      throw new Error("Graph client not initialized. Call setGraphClient in web part onInit().");
    }
    return this._graphClient;
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }
}

export default MSGraphClientService;