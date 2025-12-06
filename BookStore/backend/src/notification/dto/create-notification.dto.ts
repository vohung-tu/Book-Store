export class CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  meta?: any;
}
