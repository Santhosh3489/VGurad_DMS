export interface IRequestItem {
    ID: number;
    RequestId: string; 
    FolderURL: string;
    Status: string;  // "InProgress", "Completed", "Rejected"
    Level_Status: string;  // "L1 Pending", "L2 Pending", 
    Requester_Name: string;
    Requester_MailId: string;
    Created: string;  
    Modified?: string;
    approvalLevels?: any[];  
}


export interface IApprovalLevel {
    Id: string;
    Req_Level: string;  
    Level_Status: 'Approved' | 'Pending' | 'notreached' | 'Rejected';
    Approver_Name?: string;
    Assigned_UserName?: string;
    Assigned_MailId?: string;
    Approved_Date?: string;
}

export interface ICreateRequestParams {
    folderURL: string;
    requesterName: string;
    requesterEmail: string;
    renewalDate: Date;
    department: string;
}

export interface IApprovalAction {
    requestId: string;
    approvalLevel: 'L1' | 'L2' | 'L3';
    action: 'Approve' | 'Reject';
    approverName: string;
    approverEmail: string;
    comments?: string;
}