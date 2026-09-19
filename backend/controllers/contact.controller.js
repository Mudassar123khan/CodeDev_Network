import Contact from "../models/Contact.js";
import { sendContactNotificationEmail } from "../services/mail.service.js";

// Public: Submit a query or suggestion
export const submitContact = async (req, res) => {
  try {
    const { name, email, type, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields (Name, Email, Subject, Message).",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const contactEntry = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      type: type || "query",
      subject: subject.trim(),
      message: message.trim(),
      userId: req.user?.id || null,
    });

    // Send email notification in background
    sendContactNotificationEmail({
      name: contactEntry.name,
      email: contactEntry.email,
      type: contactEntry.type,
      subject: contactEntry.subject,
      message: contactEntry.message,
    }).catch((err) => console.error("Email notification background error:", err));

    return res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received.",
      data: contactEntry,
    });
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while saving your message.",
      error: error.message,
    });
  }
};

// Admin: Get all submitted contact messages
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("userId", "name username email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Admin: Update contact status
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_review", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, in_review, or resolved.",
      });
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating contact status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Admin: Delete contact message
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
