import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counselor } from '../../entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Counselor)
    private readonly counselorRepository: Repository<Counselor>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const counselor = await this.counselorRepository.findOne({
      where: { id: payload.sub },
    });

    if (!counselor) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return { id: counselor.id, email: counselor.email, name: counselor.name };
  }
}
