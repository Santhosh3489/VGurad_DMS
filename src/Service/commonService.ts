import { SPFI } from "@pnp/sp";
import { getSP } from "../Config/pnpConfig";
import MSGraphClientService from "../Config/msGraph";

const context = MSGraphClientService.getInstance();

// export const getCurrentUser = async () => {
//   try {
//     const graph = MSGraphClientService.getInstance().getGraphClient();
//     if (!graph) throw new Error("Graph client is not initialized");

//     const user = await graph
//       .api('/me')
//       .select('id, displayName, mail, mobilePhone, jobTitle, officeLocation, surname, userPrincipalName, mailNickname')
//       .get();

//     return user;
//   } catch (error) {
//     console.error("Error in getCurrentUser:", error);
//     throw error;
//   }
// };

export const getCurrentUser = async () => {
  try {
    // Check if graph client is initialized
    if (!MSGraphClientService.getInstance().isInitialized()) {
      throw new Error("Graph client not initialized yet");
    }

    const context = MSGraphClientService.getInstance();
    const graph = context.getGraphClient();

    const user = await graph
      .api('/me')
      .select('id, displayName, mail, mobilePhone, jobTitle, officeLocation, surname, userPrincipalName, MailNickName')
      .get();

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<any[]> => {
  try {
    const graphClient = MSGraphClientService.getInstance().getGraphClient();
    let users: any[] = [];
    let nextLink: string | null = null;

    // Initial request
    const response = await graphClient.api('/users')
      .top(999) // Request maximum number of records per page
      .get();

    // Add the users from the first response
    users = [...response.value];
    nextLink = response["@odata.nextLink"];

    // Continue fetching if there are more pages
    while (nextLink) {
      // The nextLink already contains the endpoint and query parameters
      const nextResponse = await graphClient.api(nextLink).get();
      users = [...users, ...nextResponse.value];
      nextLink = nextResponse["@odata.nextLink"];

      // console.log(`Fetched ${users.length} users so far...`);
    }

    users.sort((a, b) => {
      const nameA = a.displayName?.toLowerCase() || '';
      const nameB = b.displayName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    // console.log(`Successfully fetched all ${users.length} Azure AD users`);
    return users;

  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getSiteUrl = async () => {
  const sp: SPFI = getSP();
  try {
    const web = await sp.web();
    // console.log("Site URL:", web.Url);
    return web.Url;
  } catch (error) {
    console.error("Error fetching site URL:", error);
  }
};
export const getSiteName = async () => {
  try {
    const siteUrl = await getSiteUrl();
    const parts = siteUrl.split('/');
    const sitesIndex = parts.indexOf('sites');
    if (sitesIndex !== -1 && parts.length > sitesIndex + 1) {
      const siteName = parts[sitesIndex + 1];
      // console.log('Site Name:', siteName);
      return siteName;
    } else {
      console.error('Site name could not be extracted from URL');
    }
  } catch (error) {
    console.error('Error fetching site name:', error);
  }
}
export const getServerRelativeUrl = async () => {
  const sp: SPFI = getSP();
  try {
    const temp = await sp.web()
    const url = temp.ServerRelativeUrl;
    // console.log(`Server Relative URL: ${url}`);
    return url;
  } catch (error) {
    console.error(`Error: ${error}`)
  }
}

export const getUserProfilePhoto = async (email: string): Promise<string | null> => {
  try {
    const graph = await context.getGraphClient();
    const photoBlob = await graph.api(`/users/${email}/photo/$value`).get();

    const url = URL.createObjectURL(photoBlob);
    return url;
  } catch (error) {
    console.log(`No photo found for ${email}`, error);
    return null;
  }
};

export const getListItems = async (listName: string, fields: string) => {
  const sp: SPFI = getSP();
  try {
    const items = await sp.web.lists.getByTitle(listName).items.select(fields).orderBy('Created', false).top(5000)();
    // console.log(`${listName} : ${JSON.stringify(items, null, 2)}`);
    return items;
  } catch (error) {
    console.error('Error fetching list items:', error);
    throw error; // Re-throw the error so it can be caught in the calling function
  }
}

export const getTechDetails = async (email) => {
  try {
    const items = await getListItems("Tickets", "*");
    const tech = items.find((u) => u.mail === email);
    return tech;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * @param listName string
 * @returns 
 */
// export const getListItems = async (listName: string, fields: string) => {
//   const sp: SPFI = getSP();
//   try {
//     const items = await sp.web.lists.getByTitle(listName).items.select(fields).orderBy('Created', false).top(5000)();
//     // console.log(`${listName} : ${JSON.stringify(items, null, 2)}`);
//     return items;
//   } catch (error) {
//     console.error('Error fetching list items:', error);
//     throw error; // Re-throw the error so it can be caught in the calling function
//   }
// }

export const getAttachments = async (listName: string, id: number) => {
  const sp: SPFI = getSP();
  try {
    const attachments = await sp.web.lists.getByTitle(listName).items.getById(id).attachmentFiles();
    // console.log('attachment files are -> ', attachments);    
    return attachments;
  } catch (error) {
    console.log('error for fetching the attachment', error);
  }
}
