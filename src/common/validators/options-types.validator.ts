import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isUniqeType', async: false })
export class IsUniqeTypeConstraint implements ValidatorConstraintInterface {
  validate(options: any[], args: ValidationArguments) {
    if (!Array.isArray(options)) {
      return false; // Not an array, should be handled by @IsArray()
    }
    const typeCounts = new Map<string, number>();

    for (const option of options) {
      // Get the current count for the option's type
      const currentCount = typeCounts.get(option.type) || 0;
      // Increment the count
      typeCounts.set(option.type, currentCount + 1);
    }

    // Check if any type appears more than two times
    for (const count of typeCounts.values()) {
      if (count > 1) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'The options array cannot contain more than two items of the same type.';
  }
}
