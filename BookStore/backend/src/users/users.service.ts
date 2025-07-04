import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './user.schema';
import { SignupDto } from './dto/signup.dto';
import { v4 as uuidv4 } from 'uuid';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ResetPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>, //decorator tiêm (thêm vào) model tương ứng vào trong constructor của service
  ) {}

  /** Đăng ký */
  async signup(dto: SignupDto): Promise<any> {
    const { email, password } = dto;
  
    // Kiểm tra user tồn tại chưa
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Email đã được sử dụng.');
  
    // Nếu không có password => dùng mặc định
    const plainPassword = password || '123456'; //admin user sử dụng cái đk này
    const hashedPassword = await bcrypt.hash(plainPassword, 10); //băm password ra để không log ra được pass 
  
    const newUser = new this.userModel({
      ...dto,
      password: hashedPassword,
    });
  
    await newUser.save();
  
    return { message: 'Đăng ký thành công' };
  }


  /** Lấy tất cả người dùng */
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /** Tìm user theo ID */
  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async createByAdmin(dto: SignupDto): Promise<any> {
    const { email } = dto;
  
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng.');
    }
  
    // Nếu không có password, gán mặc định
    const plainPassword = dto.password || '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
    const newUser = new this.userModel({
      ...dto,
      password: hashedPassword,
    });
  
    await newUser.save();
  
    return { message: 'Tạo người dùng thành công' };
  }

  async updateUser(id: string, updateData: any) {
    const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
  
    return this.userModel.findByIdAndDelete(id);
  }

  // Hàm thêm địa chỉ vào mảng địa chỉ của người dùng
  async addAddress(userId: string, newAddress: { value: string; isDefault: boolean }): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.address.push(newAddress);  // Thêm đối tượng địa chỉ mới vào mảng
    await user.save();
    return user;
  }

  // Hàm cập nhật tất cả địa chỉ
  async updateAddress(
    userId: string,
    addresses: { value: string; isDefault: boolean; fullName?: string; phoneNumber?: number }[]
  ): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { address: addresses },
      { new: true }
    );
  
    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
  
    return updatedUser;
  }
  
  // Hàm xóa địa chỉ trong mảng địa chỉ của người dùng
  async removeAddress(userId: string, addressToRemove: { value: string; isDefault: boolean }): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.address = user.address.filter(address => address.value !== addressToRemove.value);  // Lọc ra địa chỉ cần xóa
    await user.save();
    return user;
  }

  async updatePassword(userId: string, payload: UpdatePasswordDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ!');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }

    const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng!');
    }

    user.password = await bcrypt.hash(payload.newPassword, 10);
    await user.save();

    return { message: 'Cập nhật mật khẩu thành công!' };
  }

  async updatePasswordById(id: string, hashedPassword: string) {
    return this.userModel.updateOne({ _id: id }, { password: hashedPassword });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async setResetToken(userId: string, token: string, expires: Date) {
    return this.userModel.updateOne(
      { _id: userId },
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      }
    );
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

}
