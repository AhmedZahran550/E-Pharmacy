import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { validateEgyptianNationalId } from '../nid-util';

@ValidatorConstraint({ async: false })
export class IsEgyptianNationalIdConstraint
  implements ValidatorConstraintInterface
{
  validate(nationalId: any, args: ValidationArguments) {
    try {
      const data = validateEgyptianNationalId(nationalId);
      const birthDate = (args.object as any).birthDate;
      if (birthDate) {
        const isSameDay =
          birthDate.getDate() === data.birthDate.getDate() &&
          birthDate.getMonth() === data.birthDate.getMonth() &&
          birthDate.getFullYear() === data.birthDate.getFullYear();
        if (!isSameDay) {
          return false;
        }
      }
      return data.isValid;
    } catch (error) {
      return false;
    }
  }
}

export function IsNid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEgyptianNationalIdConstraint,
    });
  };
}
