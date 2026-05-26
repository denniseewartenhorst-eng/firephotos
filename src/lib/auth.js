import { parse, serialize } from 'cookie';

const COOKIE_NAME = 'fp_user_id';

export function setSessionCookie(res, userId) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, String(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }));
}

export function getUserIdFromReq(req) {
  const cookies = parse(req.headers.cookie || '');
  const id = cookies[COOKIE_NAME];
  return id ? Number(id) : null;
}
