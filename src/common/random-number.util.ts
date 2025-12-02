function generateRandomDigitNumber(
  min: number,
  max: number,
  maxIdenticalConsecutiveDigits: number = 1,
): number {
  let number: number;

  if (maxIdenticalConsecutiveDigits <= 1) {
    number = generateRandomNumber(min, max);
  } else {
    do {
      number = generateRandomNumber(min, max);
    } while (
      hasIdenticalConsecutiveDigits(number, maxIdenticalConsecutiveDigits)
    );
  }

  return number;
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hasIdenticalConsecutiveDigits(number: number, limit: number): boolean {
  const numStr = number.toString();
  let count = 1;

  for (let i = 1; i < numStr.length; i++) {
    if (numStr[i] === numStr[i - 1]) {
      count++;
      if (count >= limit) {
        return true;
      }
    } else {
      count = 1;
    }
  }

  return false;
}

export { generateRandomDigitNumber };