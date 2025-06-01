import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "../user.schema";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { SigninDto } from "../dto/signin.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) {}

  signToken(user: UserDocument) {
    return this.jwtService.sign({ sub: user._id, role: user.role, email: user.email });
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
}