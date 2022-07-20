import moment from 'moment';

export const PWD_SALT_WORK_FACTOR = 10;
export const PWD_MAX_LOGIN_ATTEMPTS = 10;
export const PWD_LOCK_TIME = moment.duration({ minute: 5 });

export const PWD_RESET_TOKEN_EMAIL_EXP = moment.duration({ minute: 20 });

export const JWT_ACCESS_TOKEN_EXP = '10 days';
export const JWT_REFRESH_TOKEN_EXP = '1 year';

export const JWT_DEFAULT_ISS = 'auth.service';
