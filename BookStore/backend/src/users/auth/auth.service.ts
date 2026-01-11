import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "../user.schema";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { SigninDto } from "../dto/signin.dto";
import * as bcrypt from 'bcrypt';
import { UsersService } from "../users.service";
import { v4 as uuidv4 } from 'uuid';
import { ResetPasswordDto } from "../dto/forgot-password.dto";
import { MailService } from "src/order/order/email.service";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private readonly mailService: MailService 
  ) {}

  signToken(user: UserDocument) {
    return this.jwtService.sign({ sub: user._id, level: user.level, role: user.role, email: user.email });
  }

  async signin(dto: SigninDto): Promise<any> {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không đúng.');
    }

    // Tạo token JWT
    const token = this.signToken(user);
    return { token, user };
  }

  async handleForgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email) as UserDocument;
    if (!user) {
      throw new NotFoundException('Email không tồn tại');
    }

    const resetToken = uuidv4();
    const expireDate = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersService.setResetToken(user.id, resetToken, expireDate);

    // Không dùng 'await' ở đây để trả về response ngay lập tức
    this.mailService.sendResetPasswordEmail(email, resetToken).catch(err => {
      console.error('Gửi mail ngầm thất bại:', err);
    });

    return { message: 'Yêu cầu đã được tiếp nhận. Vui lòng kiểm tra email của bạn.' };
  }

  async findUserByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Token còn hạn
    });
  }

  async resetPasswordFromLink(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;

    const user = await this.findUserByResetToken(token);
    if (!user) {
      throw new NotFoundException('Token không hợp lệ hoặc đã hết hạn');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // 🛡 Lọc bỏ địa chỉ rỗng (nếu có)
    if (user.address) {
      user.address = user.address.filter(addr => addr && addr.value);
    }

    await user.save();

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const user = await this.userModel.findOne({ email }).exec();
    return { exists: !!user };
  }


  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  }
}