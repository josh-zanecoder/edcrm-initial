import Member from '@/models/Member';
import Prospect from '@/models/Prospect';
import { SalesPersonModel } from '@/models/SalesPerson';
import { unformatPhoneNumber } from '@/utils/formatters';
import twilio from 'twilio';
import connectToMongoDB from '@/lib/mongoose';
interface MemberType {
  firstName?: string;
  lastName?: string;
  collegeName?: string;
}

export async function POST(req: Request) {
  try {
    // Ensure MongoDB connection is established
    await connectToMongoDB();

    const formData = await req.formData();
    const from = formData.get('From') as string | null;
    const to = formData.get('To') as string | null;
    const callSid = formData.get('CallSid') as string | null;
   
    const queryNumber = unformatPhoneNumber(to as string);
    
    // Try direct MongoDB query first
    const salesPerson = await SalesPersonModel.findOne(
      { twilio_number: queryNumber }
    ).exec();

    console.log('Incoming call handling:', {
      from,
      to,
      callSid,
      queryNumber,
      salesPerson: {
        email: salesPerson?.email,
        twilioNumber: salesPerson?.twilio_number,
        isForwarding: salesPerson?.is_forwarding,
        forwardingNumber: salesPerson?.forwarding_number
      }
    });

    const twiml = new twilio.twiml.VoiceResponse();
    
    const [prospect, member] = await Promise.all([
      Prospect.findOne({ phone: unformatPhoneNumber(from as string) }).lean<MemberType>().exec(),
      Member.findOne({ phone: unformatPhoneNumber(from as string) }).lean<MemberType>().exec()
    ]);
    
    const foundMember = prospect || member;
    
    if(!foundMember){
      console.log('No member found for incoming call:', { from, to });
      twiml.say("You are not a registered member or prospect.")
      return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const dial = twiml.dial({
      callerId: from || undefined,
      record: 'record-from-answer',
      recordingTrack: 'both',
      recordingStatusCallback: `/api/twilio/recording-status`,
      recordingStatusCallbackEvent: ['completed'],
      recordingStatusCallbackMethod: 'POST',
      action: `/api/twilio/dial-status`,
      answerOnBridge: true,
      hangupOnStar: true
    });

    if (salesPerson?.forwarding_number && salesPerson?.is_forwarding) {
      console.log('Forwarding call to external number:', {
        forwardingNumber: salesPerson.forwarding_number,
        salesPersonEmail: salesPerson.email
      });
      dial.number(salesPerson.forwarding_number);
    } else if (salesPerson) {
      const clientIdentity = `user-${salesPerson.email}`;
      console.log('Connecting call to browser client', {
        clientIdentity,
        salesPersonEmail: salesPerson.email,
        salesPersonId: salesPerson._id,
        foundMember: {
          phone: foundMember.phone,
          name: foundMember.firstName
        },
        callSid: callSid
      });
      const client = dial.client({
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallback: `/api/twilio/incoming-call-status`,
        statusCallbackMethod: 'POST'
      }, clientIdentity);

      client.parameter({
        name: 'FirstName',
        value: foundMember?.firstName || foundMember?.collegeName || ''
      });
      client.parameter({
        name: 'LastName',
        value: foundMember?.lastName || ''
      });
    } else {
      console.log('No sales person found for incoming call:', { to, queryNumber });
      twiml.say("We're sorry, but we cannot connect your call at this time.");
    }

    const twimlResponse = twiml.toString();
    console.log('bbbbbbbbbbb', twimlResponse);
    return new Response(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('Error handling incoming call:', err);
    
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say(
      { voice: 'alice', language: 'en-US' },
      'We apologize, but we are unable to process your call at this time. Please try again later.'
    );
    
    return new Response(errorTwiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
} 