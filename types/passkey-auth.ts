export interface PasskeyAuthenticationVerifyResponse {
  success: true;
  loginToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
