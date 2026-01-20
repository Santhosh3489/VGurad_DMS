import * as React from 'react';
import { getCurrentUser } from '../../../../Service/commonService';
import { fetchApproverData } from '../../components/Helper/helperService';

const L1Approver = () => {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const currentUser = await getCurrentUser();
      const response = await fetchApproverData(currentUser.mail || currentUser.userPrincipalName);
      console.log('response data is', response);
      
    } catch(error) {
      console.log("Error While fetching the data");
    }
  }

  return (
    <div>
      L1Approver
    </div>
  )
}

export default L1Approver;