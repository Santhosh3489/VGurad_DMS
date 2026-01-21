import { SPFI } from '@pnp/sp';
import { getSP } from '../../../../Config/pnpConfig';
import "@pnp/sp/items";
import "@pnp/sp/lists";
import { ICreateRequestParams, IApprovalAction } from './helperConfig';

export const generateRequestId = async (): Promise<string> => {
    const sp: SPFI = getSP();
    try {
        const items = await sp.web.lists
            .getByTitle('DMS_request')
            .items
            .select('RequestId')
            .orderBy('Created', false)
            .top(1)();

        if (items.length === 0) {
            return 'Req00001';
        }

        const lastRequestId = items[0].RequestId;
        const numberPart = parseInt(lastRequestId.replace('Req', ''));
        const newNumber = numberPart + 1;
        return `Req${String(newNumber).padStart(5, '0')}`;
    } catch (error) {
        console.error('Error generating request ID:', error);
        return 'Req00001';
    }
}

export const getApproversByLevel = async (level: 'L1_Approver' | 'L2_Approver' | 'L3_Approver'): Promise<any[]> => {
    const sp: SPFI = getSP();
    try {
        const approvers = await sp.web.lists
            .getByTitle('User_Configuration')
            .items
            .filter(`ApprovelLevel eq '${level}' and ApproverAccess eq 1`)
            .select('UserName', 'UserEmailId')();

        console.log("Approvers", approvers);

        return approvers;
    } catch (error) {
        console.log(`Error fetching ${level} approvers:`, error);
        return [];
    }
}

const createApprovalTrackingRecords = async (requestId: string, params: ICreateRequestParams): Promise<void> => {
    const sp: SPFI = getSP();
    try {

         const department = params.department;
        
         // Get L1 approvers for this department
        const l1Approvers = await sp.web.lists
            .getByTitle('User_Configuration')
            .items
            .filter(`ApprovelLevel eq 'L1_Approver' and ApproverAccess eq 1 and Department eq '${department}'`)
            .select('UserName', 'UserEmailId')();

            // Get L2 approvers for this department
        const l2Approvers = await sp.web.lists
            .getByTitle('User_Configuration')
            .items
            .filter(`ApprovelLevel eq 'L2_Approver' and ApproverAccess eq 1 and Department eq '${department}'`)
            .select('UserName', 'UserEmailId')();

        // Get L3 approvers for this department
        const l3Approvers = await sp.web.lists
            .getByTitle('User_Configuration')
            .items
            .filter(`ApprovelLevel eq 'L3_Approver' and ApproverAccess eq 1 and Department eq '${department}'`)
            .select('UserName', 'UserEmailId')();


        if (l1Approvers.length > 0) {
            await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items.add({
                RequestId: requestId,
                Req_Level: 'L1 Approval',
                FileURL: params.folderURL,
                Assigned_UserName: l1Approvers[0].UserName,
                Assigned_MailId: l1Approvers[0].UserEmailId,
                Level_Status: 'Pending',
                Requester_Name: params.requesterName,
                Requester_MailId: params.requesterEmail,
                Approver_Name: null,
                Approver_MailId: null,
                Approved_Date: null,
                Comments: ''
            })
        }

        if (l2Approvers.length > 0) {
            await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items.add({
                RequestId: requestId,
                Req_Level: 'L2 Approval',
                FileURL: params.folderURL,
                Assigned_UserName: l2Approvers[0].UserName,
                Assigned_MailId: l2Approvers[0].UserEmailId,
                Level_Status: 'Not-Started',
                Requester_Name: params.requesterName,
                Requester_MailId: params.requesterEmail,
                Approver_Name: null,
                Approver_MailId: null,
                Approved_Date: null,
                Comments: ''
            })
        }

        if (l3Approvers.length > 0) {
            await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items.add({
                RequestId: requestId,
                Req_Level: 'L3 Approval',
                FileURL: params.folderURL,
                Assigned_UserName: l3Approvers[0].UserName,
                Assigned_MailId: l3Approvers[0].UserEmailId,
                Level_Status: 'Not-Started',
                Requester_Name: params.requesterName,
                Requester_MailId: params.requesterEmail,
                Approver_Name: null,
                Approver_MailId: null,
                Approved_Date: null,
                Comments: ''
            })
        }
        console.log(`Created approval tracking records for ${requestId}`);
    } catch (error) {
        console.log(`Created approval tracking records for ${requestId}`);
        throw error;
    }
}


const updateApprovalStatus = async ( 
    requestId: string,
    level: 'L1' | 'L2' | 'L3',
    action: 'Approved' | 'Rejected',
    approverName: string,
    approverEmail: string
): Promise<void> => {

    const sp: SPFI = getSP();
    const list = sp.web.lists.getByTitle('Req_Approval_Lvl_Details');

    const currentItems = await list.items
                         .filter(`RequestId eq '${requestId}' and Req_Level eq '${level} Approval'`)();
      if(currentItems.length === 0) return;
      
      const currentItemId = currentItems[0].Id;

      await list.items.getById(currentItemId).update({
         Level_Status: action === 'Approved' ? 'Approved' : 'Rejected',
         Approver_Name: approverName,
         Approver_MailId: approverEmail,
         Approved_Date: new Date().toISOString()
      });

      if(level === 'L1'){
         if(action === 'Approved'){
             const l2Items = await list.items.filter(`RequestId eq '${requestId}' and Req_Level eq 'L2 Approval'`)();
            if(l2Items.length>0){
                await list.items.getById(l2Items[0].Id).update({
                    Level_Status: 'Pending'
                })
            }
         }
      }

      if(level === 'L2'){
         if(action === 'Approved'){
             const l3Items = await list.items.filter(`RequestId eq '${requestId}' and Req_Level eq 'L3 Approval'`)();
            if(l3Items.length>0){
                await list.items.getById(l3Items[0].Id).update({
                    Level_Status: 'Pending'
                })
            }
         }
      }

      if(level === 'L3'){
        await list.items.getById(currentItemId).update({
            Level_Status: action === 'Approved' ? 'Completed' : 'Rejected'
        })
      }
}

const updateMainRequestStatus = async (requestId: string, status: string, levelStatus: string): Promise<void> => {
    const sp: SPFI = getSP();
    try {
        const requests = await sp.web.lists
            .getByTitle('DMS_Request')
            .items
            .filter(`RequestId eq '${requestId}'`)();

        if (requests.length > 0) {
            await sp.web.lists.getByTitle('DMS_Request').items.getById(requests[0].Id).update({
                Status: status,
                Level_Status: levelStatus
            });
        }
    } catch (error) {
        console.log("Error updating main request status:", error);
    }
}

export const createDMSRequest = async (params: ICreateRequestParams): Promise<string> => {
    const sp: SPFI = getSP();
    try {
        const requestId = await generateRequestId();
        await sp.web.lists.getByTitle('DMS_Request').items.add({
            RequestId: requestId,
            FolderURL: params.folderURL,
            Status: 'InProgress',
            Level_Status: 'L1 Pending',
            Requester_Name: params.requesterName,
            Requester_MailId: params.requesterEmail,
            Renewal_date: params.renewalDate,
            Department: params.department
        });

        console.log("Entry in dms");
        await createApprovalTrackingRecords(requestId, params);
        return requestId;
    } catch (error) {
        console.log('Error creating DMS request:', error);
        throw error;
    }
}

export const processApprovalAction = async (params: IApprovalAction): Promise<void> => {
    const sp: SPFI = getSP();
    try {
        const { requestId, approvalLevel, action, approverName, approverEmail, comments } = params;
        const approvalRecords = await sp.web.lists
            .getByTitle('Req_Approval_Lvl_Details')
            .items
            .filter(`RequestId eq '${requestId}' and Req_Level eq '${approvalLevel} Approval'`)();

        if (approvalRecords.length > 0) {
            const recordId = approvalRecords[0].Id;
            await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items.getById(recordId).update({
                Level_Status: action === 'Approve' ? 'Approved' : 'Rejected',
                Approver_Name: approverName,
                Approver_MailId: approverEmail,
                ApprovedDate: new Date().toISOString(),
                Comments: comments || ''
            });
            
if (action === 'Reject') {

  await updateMainRequestStatus(
    requestId,
    'Rejected',
    `${approvalLevel} Rejected`
  );
  return; 
}

if (action === 'Approve') {
  if (approvalLevel === 'L1') {
    await updateMainRequestStatus(
      requestId,
      'InProgress',
      'L2 Pending'
    );
  } 
  else if (approvalLevel === 'L2') {
    await updateMainRequestStatus(
      requestId,
      'InProgress',
      'L3 Pending'
    );
  } 
  else if (approvalLevel === 'L3') {
    await updateMainRequestStatus(
      requestId,
      'Approved',
      'Completed'
    );
  }
}

        }
    } catch (error) {
        console.log('Error processing approval action:', error);
        throw error;
    }
};

export const getUserRequestsWithDetails = async (userEmail: string): Promise<any[]> => {
    const sp: SPFI = getSP();
    try {
        const requests = await sp.web.lists
            .getByTitle('DMS_Request')
            .items
            .filter(`Requester_MailId eq '${userEmail}'`)
            .orderBy('Created', false)();

        // For each request, get approval details
        const requestsWithDetails = await Promise.all(
            requests.map(async (request) => {
                const approvalDetails = await sp.web.lists
                    .getByTitle('Req_Approval_Lvl_Details')
                    .items
                    .filter(`RequestId eq '${request.RequestId}'`)
                    .orderBy('Req_Level', true)();

                return {
                    ...request,
                    approvalLevels: approvalDetails
                }
            }))
        return requestsWithDetails;
    } catch (error) {
        console.log('Error fetching user requests:', error);
        throw error;
    }
}


export const getPendingApprovalsForUser = async (userEmail: string): Promise<any[]> => {
    const sp: SPFI = getSP();
    try {
        const pendingApprovals = await sp.web.lists
            .getByTitle('Req_Approval_Lvl_Details')
            .items
            .filter(`Assigned_MailId eq '${userEmail}' and Level_Status eq 'Pending'`)
            .orderBy('Created', false)();

        return pendingApprovals;
    } catch (error) {
        console.log('Error fetching pending approvals:', error);
        throw error;
    }
}

export const getApprovalLevelsByRequestId = async (requestId: string) => {
    const sp = getSP();
    return await sp.web.lists
        .getByTitle('Req_Approval_Lvl_Details')
        .items
        .filter(`RequestId eq '${requestId}'`)
        .select(
            'Id',
            'RequestId',
            'Req_Level',
            'Level_Status',
            'Approver_Name',
            'Assigned_UserName',
            'Assigned_MailId',
            'Approved_Date'
        )();
};