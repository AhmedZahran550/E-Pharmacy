export const baseConfig = () => {
  return {
    NODE_ENV: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 3000,
    jwt: {
      accessToken: {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      },
      refreshToken: {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      },
      resetToken: {
        secret: process.env.JWT_RESET_SECRET,
        expiresIn: process.env.JWT_RESET_EXPIRES_IN,
      },
    },
    points: {
      POINTS_TO_BALANCE_CONVERTION_RATE:
        process.env.POINTS_TO_BALANCE_CONVERTION_RATE || 0.1,
      REFERRAL_POINTS: process.env.REFERRAL_POINTS || 100,
      INVITATION_POINTS: process.env.INVITATION_POINTS || 100,
      SUBSCRIPTION_POINTS: process.env.SUBSCRIPTION_POINTS || 100,
      ADD_MEMBER_POINTS: process.env.ADD_MEMBER_POINTS || 100,
      ORDER_POINTS: process.env.ORDER_POINTS || 100,
      PROFILE_COMPLETION_POINTS: process.env.PROFILE_COMPLETION_POINTS || 100,
      EXPIRATION_IN_DAYS: process.env.EXPIRATION_IN_DAYS || 30,
    },
    FALLBACK_LANGUAGE: 'ar',
  };
};
