export interface UserRegistrationEvent {
  email: string;
  firstName: string;
  verificationToken: string;
  timestamp: number;
}
