const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { generateQRCodeDataUrl } = require('../utils/qr');
const { sendMail, projectLink } = require('../utils/mailer');

const registerForEvent = async (req, res) => {
  try {
    const user = req.user; // set by auth middleware
    const { 
      eventId,
      name,
      email,
      phone,
      college,
      branch,
      year,
      rollNumber,
      address,
      emergencyContact,
      specialRequirements
    } = req.body;
    
    if (!eventId) return res.status(400).json({ message: 'Missing eventId' });
    if (!name || !email || !phone || !college || !branch || !year || !rollNumber || !emergencyContact) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // prevent duplicate registration
    const existing = await Registration.findOne({ user: user._id, event: eventId });
    if (existing) return res.status(400).json({ message: 'Already registered' });

    const reg = await Registration.create({ 
      user: user._id, 
      event: eventId,
      name,
      email,
      phone,
      college,
      branch,
      year,
      rollNumber,
      address,
      emergencyContact,
      specialRequirements
    });

    // generate QR that encodes registration id (or a URL for check-in)
    const payload = JSON.stringify({ registrationId: reg._id.toString() });
    const qrDataUrl = await generateQRCodeDataUrl(payload);
    reg.qrCodeDataUrl = qrDataUrl;
    await reg.save();

    // send confirmation mail with QR
    try {
      const eventUrl = `${projectLink}/events/${event._id}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Registration Confirmed</h2>
          <p>Hi ${name},</p>
          <p>You're registered for <strong>${event.title}</strong> on ${new Date(event.date).toLocaleString()}.</p>
          <p>Show this QR code at check-in:</p>
          <img src="${qrDataUrl}" alt="QR" style="max-width: 220px; border: 1px solid #e2e8f0; padding: 12px; background: #fff;" />
          <p><a href="${eventUrl}" style="color: #0891b2;">View Event Details</a></p>
          <p>Project Link: <a href="${projectLink}">${projectLink}</a></p>
        </div>
      `;
      await sendMail({ to: email, subject: `Registration: ${event.title}`, html });
    } catch (mailErr) {
      console.warn('Mail send failed', mailErr.message);
    }

    res.json({ registration: reg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const getUserRegistrations = async (req, res) => {
  try {
    const user = req.user;
    const regs = await Registration.find({ user: user._id }).populate('event');
    res.json(regs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch registrations' });
  }
};

module.exports = { registerForEvent, getUserRegistrations };
