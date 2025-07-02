const passwordResetTemplate = (name, resetLink) => `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Password Reset Request</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You recently requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetLink}" style="display: inline-block; background-color: #0078D4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
    </body>
  </html>
`;

const accountCreatedTemplate = (name, email) => `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Welcome to C2DeVal!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account has been successfully created with the email: <strong>${email}</strong>.</p>
      <p>You can now log in and start using our platform.</p>
      <p>Thanks for joining us!</p>
    </body>
  </html>
`;

const testAnnouncementTemplate = (name, testTitle, testLink) => `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>New Test Available: ${testTitle}</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>A new test titled <strong>${testTitle}</strong> is now available for you.</p>
      <p>Click the link below to take the test:</p>
      <a href="${testLink}" style="display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Take Test
      </a>
      <p>Good luck!</p>
    </body>
  </html>
`;

const otpTemplate = (name, otp) => `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Verification Code</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your one-time password (OTP) is:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">${otp}</div>
      <p>This OTP is valid for the next 10 minutes. Do not share it with anyone.</p>
    </body>
  </html>
`;

module.exports = {
  passwordResetTemplate,
  accountCreatedTemplate,
  testAnnouncementTemplate,
  otpTemplate,
};
