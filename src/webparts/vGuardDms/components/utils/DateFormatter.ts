import moment from "moment";
export class DateFormatter {
    public static formatDate(dateString: string, format: string = 'MMM DD, YYYY'): string {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    public static formatDateTime(dateString: string): string {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

 public static formatDateAndTime(dateString: string): string {
    if (!dateString) return '';

   return moment(dateString).format('MMMM Do • h:mm a');
  }

}


//•