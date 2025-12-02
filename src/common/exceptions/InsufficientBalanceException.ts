// src/common/exceptions/insufficient-balance.exception.ts
import { BadRequestException } from '@nestjs/common';
import { ErrorCodes } from '@/common/error-codes';

export class InsufficientBalanceException extends BadRequestException {
  constructor() {
    super(
      [
        {
          property: 'amount',
          code: ErrorCodes.INSUFFICIENT_BALANCE,
        },
      ],
      ErrorCodes.INSUFFICIENT_BALANCE,
    );
  }
}

