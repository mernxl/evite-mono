import { includes } from 'ramda';

import { invariant } from './validations';

export const CharURegex = /[A-Z]/;
export const CharLRegex = /[a-z]/;
export const NumberRegex = /[0-9]/;
export const OthersRegex = /[!#$%&()*+\-/?@[\]^_{|}~]/;

// generate random numbers, excluding 10
export const generateOTPCode = (length = 5): string =>
  Array(length).fill(10).map(randomClamp).join('');

/**
 * Generate a random number, clamped at max
 * It does not include max, since its considering from 0 to (max-1)
 * @param max
 */
const randomClamp = (max: number) => Math.min(parseInt((Math.random() * 10).toFixed(0)), max - 1);

/**
 * Method to set a character at a position in a string
 */
const setCharAt = (str: string, index: number, chr: string) => {
  if (index > str.length - 1) return str;

  return str.substr(0, index) + chr + str.substr(index + 1);
};

/**
 * Password generator
 * Should generate passwords that contain at least one of the following ASCII character sets
 * A - Z
 * a - z
 * 0 - 9
 * !#$%&()*+-/?@[]^_{|}~ at least one, then powers of 8
 *
 * So minimum password length is 4
 */
export const generatePassword = (len = 8): string => {
  const s = '!#$%&()*+-/?@[]^_{|}~';

  invariant(len >= 4, 'Minimum password length is 4.');

  const getCharFromStart = (start: string) => {
    if (start === '!') {
      return s.charAt(randomClamp(s.length));
    }
    return String.fromCodePoint(Number(randomClamp(start === '0' ? 10 : 26) + start.charCodeAt(0)));
  };

  let sb = '';
  // take len * 2 to have multiple to pick from when shuffling
  for (let i = 0; i < len * 2; i += 3) {
    sb += getCharFromStart('0');
    sb += getCharFromStart('a');
    sb += getCharFromStart('A');
  }

  // at least 1 of other, then we may add  / 8
  for (let i = 0; i < Math.ceil(len / 8); i++) {
    sb += getCharFromStart('!');
  }

  // shuffle the letters
  for (let i = 0; i < sb.length; i++) {
    const r = randomClamp(sb.length);
    const temp = sb.charAt(i);

    sb = setCharAt(sb, i, sb.charAt(r));
    sb = setCharAt(sb, r, temp);
  }

  // ensure at least 1 of all
  const matches: [RegExpMatchArray | null, string][] = [
    [sb.substr(0, len).match(CharURegex), 'A'],
    [sb.substr(0, len).match(CharLRegex), 'a'],
    [sb.substr(0, len).match(NumberRegex), '0'],
    [sb.substr(0, len).match(OthersRegex), '!'],
  ];

  const matched = matches
    .map((match) => (match[0] ? match[0].index : null))
    .filter((index) => index !== null);

  // ensure we have one of each, avoid over writing already check positions
  for (let i = 0; i < matches.length; i++) {
    if (!matches[i][0]) {
      let availableSpace = i;

      for (let j = 0; j < matches.length; j++) {
        // if space not already used
        if (!includes(j, matched)) {
          availableSpace = j;
          matched.push(j);
          break;
        }
      }

      sb = setCharAt(sb, availableSpace, getCharFromStart(matches[i][1]));
    }
  }

  return sb.slice(0, len);
};
