import { SPFI } from "@pnp/sp";
import { getSP } from "../../../../Config/pnpConfig";

export const fetchApproverData = async (mail: string) => {
    const sp: SPFI = getSP();
    try {
        // Fetching the pending items level data for the logged in user ...
        const pendingApprovalItems = await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items
            .filter(`Assigned_MailId eq '${mail}'`).select('*').top(5000)();
        // console.log('All Pending approval Items are ', pendingApprovalItems);



        const items = pendingApprovalItems;
        return items;
    } catch (error) {
        console.error('Error fetching list items:', error);
        throw error; // Re-throw the error so it can be caught in the calling function
    }
}

export const fetchPendingApproverData = async (mail: string) => {
    const sp: SPFI = getSP();
    try {
        // Fetching the pending items level data for the logged in user ...
        const pendingApprovalItems = await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items
            .filter(`LevelStatus eq 'Pending'`).select('*').top(5000)();
        console.log('All Pending approval Items are ', pendingApprovalItems);

         const approvedApprovalItems = await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items
            .filter(`LevelStatus eq 'Approved'`).select('*').top(5000)();
        console.log('All Approved approval Items are ', approvedApprovalItems);

        

        const items = pendingApprovalItems;
        return items;
    } catch (error) {
        console.error('Error fetching list items:', error);
        throw error; // Re-throw the error so it can be caught in the calling function
    }
}