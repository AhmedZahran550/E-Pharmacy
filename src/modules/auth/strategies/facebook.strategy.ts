import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-facebook';

export interface FacebookProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID'),
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET'),
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const facebookProfile: FacebookProfile = {
      id,
      email: emails?.[0]?.value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      photo: photos?.[0]?.value,
    };

    done(null, facebookProfile);
  }
}
