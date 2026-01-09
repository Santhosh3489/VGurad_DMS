import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IVGuardDmsProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
  isInitialized: boolean;
}

export interface IUser {
    Id: string | number;
    Title: string;
    Email: string;
    LoginName: string;
    //optional from graph
    JobTitle?: string;
    Department?: string;
    PhotoUrl?: string;
}

