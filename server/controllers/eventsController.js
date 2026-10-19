const Event = require('../models/Event');
const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');
const { sendMail, projectLink } = require('../utils/mailer');

// Create event (admin)
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, category, location, image } = req.body;
    const event = { title, description, date, time, category, location };
    if (image) {
      // image can be a dataURL or remote URL
      const result = await cloudinary.uploader.upload(image, { folder: 'events' });
      event.image = { url: result.secure_url, public_id: result.public_id };
    }
    if (req.admin) event.createdBy = req.admin._id;
    const created = await Event.create(event);

    const users = await User.find().select('name email');
    if (users.length > 0) {
      const eventUrl = `${projectLink}/events/${created._id}`;
      const promises = users.map((user) => {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">New Event at EventSync</h2>
            <p>Hi ${user.name || 'Student'},</p>
            <p>A new event has been published: <strong>${created.title}</strong>.</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Date:</strong> ${new Date(created.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${created.time}</p>
              <p><strong>Location:</strong> ${created.location}</p>
              <p><strong>Description:</strong> ${created.description || 'Check out the event details and register soon.'}</p>
            </div>
            <p><a href="${eventUrl}" style="display: inline-block; background: #0891b2; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">View Event</a></p>
          </div>
        `;

        return sendMail({
          to: user.email,
          subject: `[EventSync] New Event: ${created.title}`,
          html,
        }).catch((mailErr) => {
          console.error(`Failed to send event email to ${user.email}:`, mailErr.message);
          return null;
        });
      });

      await Promise.allSettled(promises);
    }

    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create event' });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch events' });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.image) {
      const result = await cloudinary.uploader.upload(updates.image, { folder: 'events' });
      updates.image = { url: result.secure_url, public_id: result.public_id };
    }
    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // optionally remove cloudinary image
    if (event.image && event.image.public_id) {
      await cloudinary.uploader.destroy(event.image.public_id);
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete event' });
  }
};

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent };
