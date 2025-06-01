export class UpdatePasswordDto {
  email?: string;
  userId: string;
  currentPassword: string;
  newPassword: string;
}