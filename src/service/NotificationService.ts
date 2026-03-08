export interface NotificationService {
  sendReservationConfirmation(email: string, roomName: string, startTime: Date, endTime: Date): Promise<void>;
  sendCancellationNotice(email: string, roomName: string): Promise<void>;
}

export class EmailNotificationService implements NotificationService {
  async sendReservationConfirmation(email: string, roomName: string, startTime: Date, endTime: Date): Promise<void> {
    // In production this would send a real email
    console.log(`Sending confirmation to ${email} for ${roomName} (${startTime.toISOString()} - ${endTime.toISOString()})`);
  }

  async sendCancellationNotice(email: string, roomName: string): Promise<void> {
    console.log(`Sending cancellation notice to ${email} for ${roomName}`);
  }
}
