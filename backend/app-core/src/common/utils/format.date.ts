export class DateUtil {
    format(date) {  
        if (!(date instanceof Date)) {
          throw new Error('Invalid "date" argument. You must pass a date instance')
        }
      
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
      
        return `${year}-${month}-${day}`
      }
}