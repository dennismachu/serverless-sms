"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const SNS = new aws_sdk_1.default.SNS();
const isSendSMSInput = (input) => {
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
const sendSingleSMS = async (phoneNumber, message, senderId) => {
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
const sendBulkSMS = async (phoneNumbers, message, senderId) => {
    const promises = phoneNumbers.map((phoneNumber) => sendSingleSMS(phoneNumber, message, senderId));
    return Promise.all(promises);
};
const sendSMS = async (event) => {
    try {
        const input = JSON.parse(event.body || '');
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
        }
        else {
            const responses = await sendBulkSMS(phoneNumbers, message, senderId);
            return {
                statusCode: 200,
                body: JSON.stringify({ messageIds: responses.map((res) => res.MessageId) }),
            };
        }
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send SMS' }),
        };
    }
};
exports.sendSMS = sendSMS;
/**
 *  The SendSMSInput type is defined to represent the expected input format.
    The isSendSMSInput function is used to validate the input before processing it.
    The sendSingleSMS function is used for sending a single SMS message, while the sendBulkSMS function is used for sending bulk SMS messages.
    The sendSMS function is updated to handle both single and bulk SMS messages based on the input provided.
 */ 
