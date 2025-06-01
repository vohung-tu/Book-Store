import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'secretKey', 
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload); // 🔍 Kiểm tra token
    
    if (!payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }

    const user = await this.userModel.findById(payload.sub).select('-password');
    return user;
  }
}