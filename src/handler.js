const AWS = require('aws-sdk');
const SNS = new AWS.SNS();
module.exports.sendSMS = async (event) => {
  const { phoneNumber, message, senderId } = JSON.parse(event.body);

  const params = {
    Message: message,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: senderId,
      },
    }
  };
  try {
    const response = await SNS.publish(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ messageId: response.MessageId }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS' }),
    };
  }
};
