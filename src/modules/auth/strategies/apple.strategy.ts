import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile, VerifyCallback } from 'passport-apple';

export interface AppleProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get<string>('APPLE_CLIENT_ID'),
      teamID: config.get<string>('APPLE_TEAM_ID'),
      keyID: config.get<string>('APPLE_KEY_ID'),
      privateKeyLocation: config.get<string>('APPLE_PRIVATE_KEY_PATH'),
      callbackURL: config.get<string>('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    // Apple only provides name on first login
    const appleProfile: AppleProfile = {
      id: profile.id,
      email: profile.email,
      firstName: profile.name?.firstName,
      lastName: profile.name?.lastName,
    };

    done(null, appleProfile);
  }
}
