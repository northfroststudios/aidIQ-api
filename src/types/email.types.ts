export interface EmailEvent {
  email: string;
  subject:string
  templateURL: string;
  timestamp: number;
  templateData: any;
}
