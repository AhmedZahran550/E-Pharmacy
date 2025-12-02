import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { LocalizedName } from '../models/localized.name';

export function IsLocalizedName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsLocalizedName',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const val = value as LocalizedName;
          const isValid = (
            typeof val === 'object' &&
            typeof val.en === 'string' &&
            val.en.length > 0 &&
            typeof val.ar === 'string' &&
            val.ar.length > 0
          );
          return isValid;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Each localized name must be a non-empty string.';
        },
      },
    });
  };
}
