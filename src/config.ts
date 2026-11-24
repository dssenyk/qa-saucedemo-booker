/** Public demo credentials. They are not secrets and must stay out of CI variables. */
export const sauce = {
  baseURL: 'https://www.saucedemo.com',
  password: 'secret_sauce',
  users: {
    standard: 'standard_user',
    locked: 'locked_out_user',
    problem: 'problem_user',
    error: 'error_user',
  },
} as const;

export const booker = {
  baseURL: 'https://restful-booker.herokuapp.com',
  username: 'admin',
  password: 'password123',
} as const;

export const customer = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '01001',
} as const;
