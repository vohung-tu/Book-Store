import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'secretKey', 
    });
  }

  async validate(payload: any) {
      console.log('JWT Payload:', payload);
      return { userId: payload.id, email: payload.email, role: payload.role };
  }
}