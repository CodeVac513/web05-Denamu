export const cookieConfig = {
  production: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  },
  development: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  },
  test: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  },
};
