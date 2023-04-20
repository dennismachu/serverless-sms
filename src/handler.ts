import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const SNS = new AWS.SNS();

type SendSMSInput = {
  phoneNumbers: string | string[];
  message: string;
  senderId?: string;
};

const isSendSMSInput = (input: any): input is SendSMSInput => {
  const { phoneNumbers, message, senderId } = input;

  if (!phoneNumbers || (!Array.isArray(phoneNumbers) && typeof phoneNumbers !== 'string')) {
    return false;
  }

  if (Array.isArray(phoneNumbers)) {
    if (phoneNumbers.length === 0 || !phoneNumbers.every((n) => typeof n === 'string')) {
      return false;
    }
  }

  if (typeof message !== 'string') {
    return false;
  }

  if (senderId && typeof senderId !== 'string') {
    return false;
  }

  return true;
};

const sendSingleSMS = async (phoneNumber: string, message: string, senderId?: string) => {
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
    },
  };

  return SNS.publish(params).promise();
};

const sendBulkSMS = async (phoneNumbers: string[], message: string, senderId?: string) => {
  const promises = phoneNumbers.map((phoneNumber) => sendSingleSMS(phoneNumber, message, senderId));
  return Promise.all(promises);
};

export const sendSMS = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const input: SendSMSInput = JSON.parse(event.body || '');
    if (!isSendSMSInput(input)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid input' }) };
    }

    const { phoneNumbers, message, senderId } = input;

    if (typeof phoneNumbers === 'string') {
      const response = await sendSingleSMS(phoneNumbers, message, senderId);
      return {
        statusCode: 200,
        body: JSON.stringify({ messageId: response.MessageId }),
      };
    } else {
      const responses = await sendBulkSMS(phoneNumbers, message, senderId);
      return {
        statusCode: 200,
        body: JSON.stringify({ messageIds: responses.map((res) => res.MessageId) }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS' }),
    };
  }
};

/**
 *  The SendSMSInput type is defined to represent the expected input format.
    The isSendSMSInput function is used to validate the input before processing it.
    The sendSingleSMS function is used for sending a single SMS message, while the sendBulkSMS function is used for sending bulk SMS messages.
    The sendSMS function is updated to handle both single and bulk SMS messages based on the input provided.
 */