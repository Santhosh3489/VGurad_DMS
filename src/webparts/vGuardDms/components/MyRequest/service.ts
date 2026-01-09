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
            .filter(`ApprovalLevel eq '${level}' and ApproverAccess eq 'yes'`)
            .select('UserName', 'UserEmailId')();

        return approvers;
    } catch (error) {
        console.log(`Error fetching ${level} approvers:`, error);
        return [];
    }
}

const createApprovalTrackingRecords = async (requestId: string, params: ICreateRequestParams): Promise<void> => {
    const sp: SPFI = getSP();

    try {

        const l1Approvers = await getApproversByLevel('L1_Approver');
        const l2Approvers = await getApproversByLevel('L2_Approver');
        const l3Approvers = await getApproversByLevel('L3_Approver');

        const currentUser = params.requesterName;

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
            })
        }


        if (l2Approvers.length > 0) {
            await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items.add({
                RequestId: requestId,
                Req_Level: 'L2 Approval',
                FileURL: params.folderURL,
                Assigned_UserName: l2Approvers[0].UserName,
                Assigned_MailId: l2Approvers[0].UserEmailId,
                Level_Status: 'Pending',
                Requester_Name: params.requesterName,
                Requester_MailId: params.requesterEmail,
            })
        }

        if (l3Approvers.length > 0) {
            await sp.web.lists.getByTitle('Req_Approval_Lvl_Details').items.add({
                RequestId: requestId,
                Req_Level: 'L3 Approval',
                FileURL: params.folderURL,
                Assigned_UserName: l3Approvers[0].UserName,
                Assigned_MailId: l3Approvers[0].UserEmailId,
                Level_Status: 'Pending',
                Requester_Name: params.requesterName,
                Requester_MailId: params.requesterEmail,
            })
        }

        console.log(`Created approval tracking records for ${requestId}`);

    } catch (error) {
        console.log(`Created approval tracking records for ${requestId}`);
        throw error;
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
            Requester_MailId: params.requesterEmail
        });

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
                await updateMainRequestStatus(requestId, 'Rejected', `${approvalLevel} Rejected`);
            } else if (action === 'Approve') {
                const nextLevel = approvalLevel === 'L1' ? 'L2' : 'L3';
                await updateMainRequestStatus(requestId, 'InProgress', `${nextLevel} Pending`);
            }

            if (approvalLevel === 'L3') {
                await updateMainRequestStatus(requestId, 'Approved', 'Completed');
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
            }
            )
        )

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