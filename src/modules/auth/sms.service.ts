import { Injectable } from '@nestjs/common';

@Injectable()
export class SMSService {
  constructor() {}

  send(mobile: string, message: string) {
    console.log('OTP sent to ' + mobile);
  }
}
