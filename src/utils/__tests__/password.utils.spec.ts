import {
  CharLRegex,
  CharURegex,
  generatePassword,
  NumberRegex,
  OthersRegex,
} from '../password.utils';

describe('password.utils', () => {
  it('should generate password with required length', () => {
    expect(generatePassword(4).length).toBe(4);
    expect(generatePassword(8).length).toBe(8);
    expect(generatePassword(12).length).toBe(12);
  });

  it('should contain at least one of all required', () => {
    const password = generatePassword(4);
    expect(password).toMatch(NumberRegex);
    expect(password).toMatch(CharURegex);
    expect(password).toMatch(CharLRegex);
    expect(password).toMatch(OthersRegex);

    const password2 = generatePassword(8);
    expect(password2).toMatch(NumberRegex);
    expect(password2).toMatch(CharURegex);
    expect(password2).toMatch(CharLRegex);
    expect(password2).toMatch(OthersRegex);
  });

  it('should contain only one others', () => {
    const password = generatePassword(8);
    expect(password.match(new RegExp(OthersRegex, 'g'))?.length).toBe(1);
  });
});
