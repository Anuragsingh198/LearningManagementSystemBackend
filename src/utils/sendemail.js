const axios = require("axios");
const { ConfidentialClientApplication } = require("@azure/msal-node");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;
const SENDER_EMAIL = "technical_user@ielektron.com"; 

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    clientSecret: CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

async function sendEmail(recipientEmail, descriptionHtml) {
  try {
    const result = await cca.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    if (!result.accessToken) {
      console.error("❌ Failed to acquire access token.");
      return;
    }

    console.log("✅ Access token acquired.");

    const getNameFromEmail = (email) => {
      const name = email.split("@")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const emailBody = `
      <html>
        <body>
          <p>Hello ${getNameFromEmail(recipientEmail)}!</p>
          <div>${descriptionHtml}</div>
        </body>
      </html>
    `;

    const emailMsg = {
      message: {
        subject: "C2DeVal",
        body: {
          contentType: "HTML",
          content: emailBody,
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipientEmail,
            },
          },
        ],
      },
    };

    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`,
      emailMsg,
      {
        headers: {
          Authorization: `Bearer ${result.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 202) {
      console.log("✅ Email sent successfully!");
    } else {
      console.error("❌ Email sending failed with status:", response.status);
    }
  } catch (err) {
    console.error("❌ Error sending email:", err.response?.data || err.message);
  }
}

module.exports = sendEmail;

