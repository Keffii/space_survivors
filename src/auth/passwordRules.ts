// Must match the Cognito password policy (amplify/auth): at least 8 characters
// with a lowercase letter, an uppercase letter, a number and a symbol.
// Cognito's symbol set: ^ $ * . [ ] { } ( ) ? " ! @ # % & / \ , > < ' : ; | _ ~ ` = + - and space.
const SYMBOL = /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`=+\- ]/;

export const PASSWORD_RULES: Array<{ id: string; label: string; test: (pw: string) => boolean }> = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'upper', label: 'An uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'number', label: 'A number', test: (pw) => /[0-9]/.test(pw) },
  { id: 'symbol', label: 'A symbol, such as ! ? # or @', test: (pw) => SYMBOL.test(pw) },
];

export function passwordMeetsRules(pw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}
