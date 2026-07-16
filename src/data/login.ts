export default function login(): { openid: string } {
  return { openid: 'mock_openid_' + Date.now() };
}
