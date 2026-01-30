import { IDatePickerStrings } from "@fluentui/react";
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


export const datePickerStrings: IDatePickerStrings = {
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  shortDays: ['S','M','T','W','T','F','S'],
  goToToday: 'Go to today',
};



//•