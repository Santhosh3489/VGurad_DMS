import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'VGuardDmsWebPartStrings';
import VGuardDms from './components/VGuardDms';
import { IVGuardDmsProps } from './components/IVGuardDmsProps';
import { getGraph, getSP } from '../../Config/pnpConfig';
import { MSGraphClientV3 } from '@microsoft/sp-http';
import MSGraphClientService from '../../Config/msGraph';
import HttpClientService from '../../Config/httpConfig';

export interface IVGuardDmsWebPartProps {
  description: string;
}

export default class VGuardDmsWebPart extends BaseClientSideWebPart<IVGuardDmsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
 private _isInitialized: boolean = false;

  public render(): void {
    const element: React.ReactElement<IVGuardDmsProps> = React.createElement(
      VGuardDms,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context,
        isInitialized: this._isInitialized, 
      }
    );

    ReactDom.render(element, this.domElement);
  }

 public async onInit(): Promise<void> {
    await super.onInit();

    try {
      //Initialize our _sp object that we can then use in other packages without having to pass around the context.
      getSP(this.context);
      
      // Initialize our _graph object for using Microsoft Graph APIs.
      getGraph(this.context);
     
      
      HttpClientService.setContext(this.context);
      HttpClientService.getInstance().setHttpClient(this.context.httpClient);
     

      // This is crucial - make sure this completes successfully
      const graphClient: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
      MSGraphClientService.getInstance().setGraphClient(graphClient);
      console.log('Graph client initialized successfully');
      
      this._isInitialized = true; // Set flag after successful initialization
      
    } catch (error) {
      console.error('Failed to initialize Graph client:', error);
      this._isInitialized = false;
    }
    
    return Promise.resolve();
  }
  
  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
