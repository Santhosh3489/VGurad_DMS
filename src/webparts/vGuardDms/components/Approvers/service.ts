import { SPFI } from '@pnp/sp';
import { getSP } from '../../../../Config/pnpConfig';
import "@pnp/sp/items";
import "@pnp/sp/lists";

export const getPendingRequestsForApprover = async (
    approverEmail: string, 
    approvalLevel: string
): Promise<any[]> => {
    const sp: SPFI = getSP();
    try {
        // First, get approval items assigned to this approver
        const approvalItems = await sp.web.lists
            .getByTitle('Req_Approval_Lvl_Details')
            .items
            .filter(`Assigned_MailId eq '${approverEmail}' and Level_Status eq 'Pending'`)
            .select(
                'Id',
                'RequestId',
                'Req_Level',
                'FileURL',
                'Assigned_UserName',
                'Assigned_MailId',
                'Requester_Name',
                'Requester_MailId',
                'Created'
            )
            .orderBy('Created', false)();

        // Filter by specific approval level (L1, L2, L3)
        const filteredApprovals = approvalItems.filter(item => {
            const itemLevel = item.Req_Level?.toUpperCase();
            const expectedLevel = approvalLevel.toUpperCase();
            return itemLevel?.includes(expectedLevel);
        });

        // Get full request details for each approval item
        const requestsWithDetails = await Promise.all(
            filteredApprovals.map(async (approval) => {
                // Get main request details
                const requestDetails = await sp.web.lists
                    .getByTitle('DMS_Request')
                    .items
                    .filter(`RequestId eq '${approval.RequestId}'`)
                    .select(
                        'ID',
                        'RequestId',
                        'FolderURL',
                        'Status',
                        'Level_Status',
                        'Requester_Name',
                        'Requester_MailId',
                        'Renewal_date',
                        'Department',
                        'Created'
                    )
                    .top(1)();

                if (requestDetails.length > 0) {
                    return {
                        ...requestDetails[0],
                        approvalDetails: approval
                    };
                }
                return null;
            })
        );

        return requestsWithDetails.filter(req => req !== null);
    } catch (error) {
        console.error('Error fetching pending requests for approver:', error);
        throw error;
    }
};


export const getApprovedRequestsForApprover = async (
    approverEmail: string,
    approvalLevel: string
): Promise<any[]> => {
    const sp: SPFI = getSP();
    try {
        const approvalItems = await sp.web.lists
            .getByTitle('Req_Approval_Lvl_Details')
            .items
            .filter(`Approver_MailId eq '${approverEmail}' and Level_Status eq 'Approved'`)
            .select(
                'Id',
                'RequestId',
                'Req_Level',
                'FileURL',
                'Approver_Name',
                'Approver_MailId',
                'Requester_Name',
                'Requester_MailId',
                'Approved_Date',
                'Created'
            )
            .orderBy('Approved_Date', false)();

        // Filter by specific approval level
        const filteredApprovals = approvalItems.filter(item => {
            const itemLevel = item.Req_Level?.toUpperCase();
            const expectedLevel = approvalLevel.toUpperCase();
            return itemLevel?.includes(expectedLevel);
        });

        // Get full request details
        const requestsWithDetails = await Promise.all(
            filteredApprovals.map(async (approval) => {
                const requestDetails = await sp.web.lists
                    .getByTitle('DMS_Request')
                    .items
                    .filter(`RequestId eq '${approval.RequestId}'`)
                    .select(
                        'ID',
                        'RequestId',
                        'FolderURL',
                        'Status',
                        'Level_Status',
                        'Requester_Name',
                        'Requester_MailId',
                        'Renewal_date',
                        'Department',
                        'Created'
                    )
                    .top(1)();

                if (requestDetails.length > 0) {
                    return {
                        ...requestDetails[0],
                        approvalDetails: approval
                    };
                }
                return null;
            })
        );

        return requestsWithDetails.filter(req => req !== null);
    } catch (error) {
        console.error('Error fetching approved requests for approver:', error);
        throw error;
    }
};

/**
 * Process approval action and update all related records
 */
export const processApproverAction = async ({
    requestId,
    approvalLevel,
    action,
    approverName,
    approverEmail,
    comments
}: {
    requestId: string;
    approvalLevel: 'L1' | 'L2' | 'L3';
    action: 'Approve' | 'Reject';
    approverName: string;
    approverEmail: string;
    comments?: string;
}): Promise<void> => {
    const sp: SPFI = getSP();
    
    try {
        // 1. Update the approval level record
        const approvalRecords = await sp.web.lists
            .getByTitle('Req_Approval_Lvl_Details')
            .items
            .filter(`RequestId eq '${requestId}' and Req_Level eq '${approvalLevel} Approval'`)();

        if (approvalRecords.length === 0) {
            throw new Error(`No approval record found for ${requestId} at level ${approvalLevel}`);
        }

        const recordId = approvalRecords[0].Id;
        
        // Update the current approval level
        await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
            .items.getById(recordId)
            .update({
                Level_Status: action === 'Approve' ? 'Approved' : 'Rejected',
                Approver_Name: approverName,
                Approver_MailId: approverEmail,
                Approved_Date: new Date().toISOString(),
                Comments: comments || ''
            });

        if (action === 'Approve') {
          
            const nextLevel = approvalLevel === 'L1' ? 'L2' : 
                            approvalLevel === 'L2' ? 'L3' : null;
            
            if (nextLevel) {
                // Find and update the next level record
                const nextLevelRecords = await sp.web.lists
                    .getByTitle('Req_Approval_Lvl_Details')
                    .items
                    .filter(`RequestId eq '${requestId}' and Req_Level eq '${nextLevel} Approval'`)();

                if (nextLevelRecords.length > 0) {
                    await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
                        .items.getById(nextLevelRecords[0].Id)
                        .update({
                            Level_Status: 'Pending'
                        });
                }

                
                await updateMainRequestStatus(
                    requestId, 
                    'InProgress', 
                    `${nextLevel} Pending`
                );
            } else {
                // If L3 approved, mark request as completed
                await updateMainRequestStatus(
                    requestId, 
                    'Completed', 
                    'All Approved'
                );
            }
        } else if (action === 'Reject') {
          
            await updateMainRequestStatus(
                requestId, 
                'Rejected', 
                `${approvalLevel} Rejected`
            );

         
            const subsequentLevels = approvalLevel === 'L1' ? ['L2', 'L3'] :
                                  approvalLevel === 'L2' ? ['L3'] : [];

            for (const level of subsequentLevels) {
                const levelRecords = await sp.web.lists
                    .getByTitle('Req_Approval_Lvl_Details')
                    .items
                    .filter(`RequestId eq '${requestId}' and Req_Level eq '${level} Approval'`)();

                if (levelRecords.length > 0) {
                    await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
                        .items.getById(levelRecords[0].Id)
                        .update({
                            Level_Status: 'Not Started'
                        });
                }
            }
        }

        console.log(`Successfully processed ${action} action for ${requestId} at ${approvalLevel} level`);
    } catch (error) {
        console.error('Error processing approver action:', error);
        throw error;
    }
};


const updateMainRequestStatus = async (
    requestId: string, 
    status: string, 
    levelStatus: string
): Promise<void> => {
    const sp: SPFI = getSP();
    try {
        const requests = await sp.web.lists
            .getByTitle('DMS_Request')
            .items
            .filter(`RequestId eq '${requestId}'`)();

        if (requests.length > 0) {
            await sp.web.lists.getByTitle('DMS_Request')
                .items.getById(requests[0].Id)
                .update({
                    Status: status,
                    Level_Status: levelStatus
                });
        }
    } catch (error) {
        console.error("Error updating main request status:", error);
        throw error;
    }
};

const updateDMSStatus = async (
  requestId: string,
  levelStatus: string
) => {
  const sp = getSP();

  const dmsItems = await sp.web.lists
    .getByTitle('DMS')
    .items
    .filter(`RequestId eq '${requestId}'`)();

  if (dmsItems.length > 0) {
    await sp.web.lists
      .getByTitle('DMS')
      .items.getById(dmsItems[0].Id)
      .update({
        Status: levelStatus
      });
  }
};


