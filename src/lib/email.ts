import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation({
  to,
  customerName,
  vehicle,
  bookingDate,
  quotationNo,
}: {
  to: string;
  customerName: string;
  vehicle: string;
  bookingDate: string;
  quotationNo: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Dealership DMS <noreply@yourdomain.com>',
      to: [to],
      subject: 'Booking Confirmation - Dealership DMS',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Booking Confirmation</h2>
          <p>Dear ${customerName},</p>
          <p>Your vehicle booking has been confirmed!</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${vehicle}</p>
            <p style="margin: 5px 0;"><strong>Booking Date:</strong> ${bookingDate}</p>
            <p style="margin: 5px 0;"><strong>Quotation No:</strong> ${quotationNo}</p>
          </div>
          <p>We'll contact you soon with further details.</p>
          <p>Thank you for choosing us!</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Dealership DMS<br/>
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}

export async function sendAppointmentConfirmation({
  to,
  customerName,
  vehicle,
  appointmentDate,
  serviceType,
}: {
  to: string;
  customerName: string;
  vehicle: string;
  appointmentDate: string;
  serviceType: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Dealership DMS <noreply@yourdomain.com>',
      to: [to],
      subject: 'Service Appointment Confirmation - Dealership DMS',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Service Appointment Confirmed</h2>
          <p>Dear ${customerName},</p>
          <p>Your service appointment has been scheduled!</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${vehicle}</p>
            <p style="margin: 5px 0;"><strong>Service Type:</strong> ${serviceType}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${appointmentDate}</p>
          </div>
          <p>Please arrive 10 minutes before your scheduled time.</p>
          <p>Thank you for choosing our service center!</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Dealership DMS<br/>
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}