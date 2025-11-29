import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { to, body, customerId } = await request.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to and body are required' },
        { status: 400 }
      );
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing Twilio environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to
    });

    console.log('SMS sent successfully:', {
      messageSid: message.sid,
      to: to,
      customerId: customerId,
      status: message.status
    });

    return NextResponse.json({
      success: true,
      messageSid: message.sid,
      status: message.status,
      to: to
    });

  } catch (error) {
    console.error('Error sending SMS:', error);

    if (error.code === 21211) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    } else if (error.code === 21408) {
      return NextResponse.json(
        { error: 'Permission to send an SMS has not been enabled for the region' },
        { status: 403 }
      );
    } else if (error.code === 21610) {
      return NextResponse.json(
        { error: 'Phone number is not SMS capable' },
        { status: 400 }
      );
    } else if (error.code === 21614) {
      return NextResponse.json(
        { error: 'This phone number is not currently reachable' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send SMS: ' + error.message },
      { status: 500 }
    );
  }
}