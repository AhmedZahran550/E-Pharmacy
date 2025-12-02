import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function IsAdult(
  age: number = 15,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsAdult',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [age],
      validator: {
        validate(birthDate: string, args: ValidationArguments) {
          const ageLimit = args.constraints[0];
          const age = Math.floor(
            (Date.now() - new Date(birthDate).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          );
          return age >= ageLimit;
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `Age must be at least ${validationArguments.constraints[0]} years old.`;
        },
      },
    });
  };
}
