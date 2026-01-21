import { SPFI } from '@pnp/sp';
import { getSP } from '../../../../Config/pnpConfig';
import "@pnp/sp/items";
import "@pnp/sp/lists";
import { ApproverAction } from './helperConfig';


const DMS_LIBRARY_STATUS_MAP: Record<string, string> = {
  'L1 Pending': 'L1 Approval Pending',
  'L2 Pending': 'L2 Approval Pending',
  'L3 Pending': 'L3 Approval Pending',

  'L1 Rejected': 'L1 Approval Rejected',
  'L2 Rejected': 'L2 Approval Rejected',
  'L3 Rejected': 'L3 Approval Rejected',

  'Completed': 'Completed'
};



export const approveDocument = async ({
  requestId,
  approverName,
  approverEmail,
  approvalLevel,
  action,
  comments
}: ApproverAction) => {
  const sp: SPFI = getSP();

  try {
    
    const approvalRecords = await sp.web.lists
      .getByTitle('Req_Approval_Lvl_Details')
      .items
      .filter(`RequestId eq '${requestId}' and Req_Level eq '${approvalLevel} Approval'`)();

    if (!approvalRecords.length) {
      throw new Error(`No approval record found for ${requestId} at level ${approvalLevel}`);
    }

    const currentRecordId = approvalRecords[0].Id;

 
    await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
      .items.getById(currentRecordId)
      .update({
        Level_Status: action === 'Approve' ? 'Approved' : 'Rejected',
        Approver_Name: approverName,
        Approver_MailId: approverEmail,
        Approved_Date: new Date().toISOString(),
        Comments: comments || ''
      });

    let newMainStatus = '';
    let newLevelStatus = '';

    if (action === 'Approve') {
     
      let nextLevel: 'L2' | 'L3' | null = approvalLevel === 'L1' ? 'L2' : approvalLevel === 'L2' ? 'L3' : null;

      while (nextLevel) {
        const nextLevelRecords = await sp.web.lists
          .getByTitle('Req_Approval_Lvl_Details')
          .items
          .filter(`RequestId eq '${requestId}' and Req_Level eq '${nextLevel} Approval'`)();

        if (!nextLevelRecords.length) break;

        const nextRecord = nextLevelRecords[0];

        if (nextRecord.Approver_MailId === approverEmail) {
         
          await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
            .items.getById(nextRecord.Id)
            .update({
              Level_Status: 'Approved',
              Approver_Name: approverName,
              Approver_MailId: approverEmail,
              Approved_Date: new Date().toISOString(),
              Comments: comments || ''
            });

          console.log(`Auto-approved ${nextLevel} as same approver`);
          nextLevel = nextLevel === 'L2' ? 'L3' : null;
        } else {
          
          await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
            .items.getById(nextRecord.Id)
            .update({ Level_Status: 'Pending' });

          newMainStatus = 'InProgress';
          newLevelStatus = `${nextLevel} Pending`;
          console.log(`Next level ${nextLevel} set to Pending`);
          break;
        }
      }

      if (!nextLevel) {
        newMainStatus = 'Completed';
        newLevelStatus = 'All Approved';
      }
    } else {

      newMainStatus = 'Rejected';
      newLevelStatus = `${approvalLevel} Approval Rejected`;

     
      const levelsToReset: ('L2' | 'L3')[] =
        approvalLevel === 'L1' ? ['L2', 'L3'] : approvalLevel === 'L2' ? ['L3'] : [];

      for (const level of levelsToReset) {
        const levelRecords = await sp.web.lists
          .getByTitle('Req_Approval_Lvl_Details')
          .items
          .filter(`RequestId eq '${requestId}' and Req_Level eq '${level} Approval'`)();

        if (levelRecords.length > 0) {
          await sp.web.lists.getByTitle('Req_Approval_Lvl_Details')
            .items.getById(levelRecords[0].Id)
            .update({ Level_Status: 'Not Started' });
        }
      }
    }

   
    const mainRequest = await sp.web.lists
      .getByTitle('DMS_Request')
      .items
      .filter(`RequestId eq '${requestId}'`)();

    if (mainRequest.length > 0) {
      await sp.web.lists.getByTitle('DMS_Request')
      .items.getById(mainRequest[0].Id)
      .update({
        Status: newMainStatus,
        Level_Status: newLevelStatus
      });
    }




    const dmsItems = await sp.web.lists
                     .getByTitle('DMS')
                     .items
                     .filter(`RequestId eq '${requestId}'`)();

         if (dmsItems.length > 0) {

          const dmsApprovalStatus =
                 DMS_LIBRARY_STATUS_MAP[newLevelStatus] || newLevelStatus;
                await sp.web.lists
                    .getByTitle('DMS')
                     .items
                     .getById(dmsItems[0].Id)
                    .update({
                    Status: dmsApprovalStatus
              });
           }


    console.log(`Request ${requestId} at ${approvalLevel} ${action}`);
  } catch (error) {
    console.error('Error approving document:', error);
    throw error;
  }
};



export const getApproverAccessMap = async (
  approverEmail: string
): Promise<Record<string, string[]>> => {

  const sp: SPFI = getSP();

  try {
    const items = await sp.web.lists
      .getByTitle('User_Configuration')
      .items
      .filter(`UserEmailId eq '${approverEmail}'`)();

     

    const accessMap: Record<string, string[]> = {};

    items.forEach(item => {
      const department = item.Department?.trim();
      const approvalLevel = item.ApprovelLevel?.trim(); 

      if (!department || !approvalLevel) return;

      if (!accessMap[department]) {
        accessMap[department] = [];
      }

      if (!accessMap[department].includes(approvalLevel)) {
        accessMap[department].push(approvalLevel);
      }
    });
    
    return accessMap;

  } catch (error) {
    console.error('Error getting approver access map:', error);
    return {};
  }
};



export const getPendingRequestsForApprover = async (
  userEmail: string
): Promise<any[]> => {

  const sp: SPFI = getSP();

  try {
    const accessMap = await getApproverAccessMap(userEmail);

    if (!accessMap || Object.keys(accessMap).length === 0) {
      return [];
    }

    
    const allowedLevelSet = new Set<string>();
    Object.values(accessMap).forEach(levels => {
      levels.forEach(level => {
        allowedLevelSet.add(level.replace('_Approver', ' Approval'));
      });
    });

    const levelFilter = Array.from(allowedLevelSet)
      .map(level => `Req_Level eq '${level}'`)
      .join(' or ');

    
    const approvalItems = await sp.web.lists
      .getByTitle('Req_Approval_Lvl_Details')
      .items
      .filter(
        `Assigned_MailId eq '${userEmail}' and Level_Status eq 'Pending' and (${levelFilter})`
      )();

    if (!approvalItems.length) return [];

   
    const results = await Promise.all(
      approvalItems.map(async approval => {

        const req = await sp.web.lists
          .getByTitle('DMS_Request')
          .items
          .filter(`RequestId eq '${approval.RequestId}'`)
          .top(1)();

        if (!req.length) return null;

        const dept = req[0].Department;
        const reqLevel = approval.Req_Level.replace(' Approval', '_Approver');

        if (!accessMap[dept]) return null;
        if (!accessMap[dept].includes(reqLevel)) return null;

        return {
          ...req[0],
          approvalDetails: approval
        };
      })
    );

    return results.filter(Boolean);

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
};



export const getApprovedRequestsForApprover = async (
  userEmail: string
): Promise<any[]> => {

  const sp: SPFI = getSP();

  try {
    const accessMap = await getApproverAccessMap(userEmail);

    if (!accessMap || Object.keys(accessMap).length === 0) {
      return [];
    }

   
    const allowedLevels = new Set<string>();
    Object.values(accessMap).forEach(levels => {
      levels.forEach(level => {
        allowedLevels.add(level.replace('_Approver', ' Approval'));
      });
    });

    const levelFilter = Array.from(allowedLevels)
      .map(level => `Req_Level eq '${level}'`)
      .join(' or ');

    
    const approvalItems = await sp.web.lists
      .getByTitle('Req_Approval_Lvl_Details')
      .items
      .filter(
        `Assigned_MailId eq '${userEmail}' and Level_Status eq 'Approved' and (${levelFilter})`
      )();

    if (!approvalItems.length) return [];

 
    const results = await Promise.all(
      approvalItems.map(async approval => {

        const req = await sp.web.lists
          .getByTitle('DMS_Request')
          .items
          .filter(`RequestId eq '${approval.RequestId}'`)
          .top(1)();

        if (!req.length) return null;

        const dept = req[0].Department;
        const reqLevel = approval.Req_Level.replace(' Approval', '_Approver');

        if (!accessMap[dept]) return null;
        if (!accessMap[dept].includes(reqLevel)) return null;

        return {
          ...req[0],
          approvalDetails: approval
        };
      })
    );

    return results.filter(Boolean);

  } catch (error) {
    console.error('Error fetching approved requests:', error);
    return [];
  }
};
