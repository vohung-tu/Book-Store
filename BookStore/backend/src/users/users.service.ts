import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './user.schema';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  /** Đăng ký */
  async signup(dto: SignupDto): Promise<any> {
    const { email, password } = dto;
    
    // Kiểm tra user tồn tại chưa
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Email đã được sử dụng.');

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo user mới
    const newUser = new this.userModel({ ...dto, password: hashedPassword });
    await newUser.save();
    
    return { message: 'Đăng ký thành công' };
  }

  /** Đăng nhập */
  async signin(dto: SigninDto): Promise<any> {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new BadRequestException('Mật khẩu không đúng.');

    // Tạo token JWT
    const token = this.jwtService.sign({ id: user._id, email: user.email });
    
    return { token };
  }

  /** Lấy tất cả người dùng */
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /** Tìm user theo ID */
  async findById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }
}
