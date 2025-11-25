import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || 'your-email@gmail.com',
    pass: functions.config().email?.password || 'your-app-password',
  },
});

// Email templates
const getEmailTemplate = (type: string, data: any) => {
  switch (type) {
    case 'new_complaint':
      return {
        subject: `New Complaint Submitted - ${data.topic}`,
        html: `
          <h2>New Complaint Submitted</h2>
          <p><strong>Student:</strong> ${data.studentName}</p>
          <p><strong>Course:</strong> ${data.course}</p>
          <p><strong>Topic:</strong> ${data.topic}</p>
          <p><strong>Description:</strong></p>
          <p>${data.description}</p>
          <p><strong>Submitted:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
          <p>Please review and take appropriate action.</p>
        `,
      };
    
    case 'complaint_reply':
      return {
        subject: `Reply Added to Complaint - ${data.topic}`,
        html: `
          <h2>New Reply Added</h2>
          <p><strong>Complaint:</strong> ${data.topic}</p>
          <p><strong>Student:</strong> ${data.studentName}</p>
          <p><strong>Replied by:</strong> ${data.replierName} (${data.replierRole})</p>
          <p><strong>Reply:</strong></p>
          <p>${data.replyMessage}</p>
          <p><strong>Time:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
        `,
      };
    
    case 'status_update':
      return {
        subject: `Complaint Status Updated - ${data.topic}`,
        html: `
          <h2>Complaint Status Updated</h2>
          <p><strong>Complaint:</strong> ${data.topic}</p>
          <p><strong>Student:</strong> ${data.studentName}</p>
          <p><strong>New Status:</strong> ${data.newStatus}</p>
          <p><strong>Updated by:</strong> ${data.updatedBy}</p>
          <p><strong>Time:</strong> ${new Date(data.updatedAt).toLocaleString()}</p>
        `,
      };
    
    case 'user_approved':
      return {
        subject: 'Account Approved - Complaint Portal',
        html: `
          <h2>Account Approved</h2>
          <p>Dear ${data.fullName},</p>
          <p>Your account has been approved by the administrator. You can now log in to the Complaint Portal system.</p>
          <p><strong>Role:</strong> ${data.role}</p>
          <p>Thank you for registering!</p>
        `,
      };
    
    case 'user_rejected':
      return {
        subject: 'Account Registration - Complaint Portal',
        html: `
          <h2>Account Registration Update</h2>
          <p>Dear ${data.fullName},</p>
          <p>Unfortunately, your account registration has been rejected by the administrator.</p>
          <p>If you believe this is an error, please contact the system administrator.</p>
        `,
      };
    
    default:
      return {
        subject: 'Notification from Complaint Portal',
        html: '<p>You have received a notification from the Complaint Portal system.</p>',
      };
  }
};

// Send email function
const sendEmail = async (to: string, type: string, data: any) => {
  try {
    const template = getEmailTemplate(type, data);
    
    const mailOptions = {
      from: functions.config().email?.user || 'your-email@gmail.com',
      to: to,
      subject: template.subject,
      html: template.html,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Trigger when a new complaint is created
export const onComplaintCreated = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const complaint = snap.data();
    const complaintId = context.params.complaintId;
    
    try {
      // Get admin users
      const adminUsers = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .where('status', '==', 'approved')
        .get();
      
      // Get professor for the course (if any)
      const professorQuery = await admin.firestore()
        .collection('users')
        .where('role', '==', 'professor')
        .where('status', '==', 'approved')
        .get();
      
      // Send email to all admins
      const adminEmails = adminUsers.docs.map(doc => doc.data().email);
      for (const email of adminEmails) {
        await sendEmail(email, 'new_complaint', {
          ...complaint,
          createdAt: complaint.createdAt?.toDate() || new Date(),
        });
      }
      
      // Assign to a professor if available (simple assignment logic)
      if (professorQuery.docs.length > 0) {
        const assignedProfessor = professorQuery.docs[0].data();
        await admin.firestore().collection('complaints').doc(complaintId).update({
          assignedProfessorId: assignedProfessor.uid,
          assignedProfessorName: assignedProfessor.fullName,
        });
        
        // Send email to assigned professor
        await sendEmail(assignedProfessor.email, 'new_complaint', {
          ...complaint,
          createdAt: complaint.createdAt?.toDate() || new Date(),
        });
      }
      
      console.log(`Complaint ${complaintId} processed successfully`);
    } catch (error) {
      console.error('Error processing complaint:', error);
    }
  });

// Trigger when a reply is added to a complaint
export const onReplyAdded = functions.firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const complaintId = context.params.complaintId;
    
    // Check if replies were added
    if (after.replies && after.replies.length > before.replies?.length) {
      const newReply = after.replies[after.replies.length - 1];
      
      try {
        // Get admin users
        const adminUsers = await admin.firestore()
          .collection('users')
          .where('role', '==', 'admin')
          .where('status', '==', 'approved')
          .get();
        
        // Send email to all admins
        const adminEmails = adminUsers.docs.map(doc => doc.data().email);
        for (const email of adminEmails) {
          await sendEmail(email, 'complaint_reply', {
            topic: after.topic,
            studentName: after.studentName,
            replierName: newReply.userName,
            replierRole: newReply.userRole,
            replyMessage: newReply.message,
            createdAt: newReply.createdAt?.toDate() || new Date(),
          });
        }
        
        // If reply is from professor, also notify the student
        if (newReply.userRole === 'professor') {
          await sendEmail(after.studentEmail, 'complaint_reply', {
            topic: after.topic,
            studentName: after.studentName,
            replierName: newReply.userName,
            replierRole: newReply.userRole,
            replyMessage: newReply.message,
            createdAt: newReply.createdAt?.toDate() || new Date(),
          });
        }
        
        console.log(`Reply notification sent for complaint ${complaintId}`);
      } catch (error) {
        console.error('Error sending reply notification:', error);
      }
    }
  });

// Trigger when complaint status is updated
export const onStatusUpdated = functions.firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const complaintId = context.params.complaintId;
    
    // Check if status was updated
    if (before.status !== after.status) {
      try {
        // Notify the student about status change
        await sendEmail(after.studentEmail, 'status_update', {
          topic: after.topic,
          studentName: after.studentName,
          newStatus: after.status,
          updatedBy: 'System',
          updatedAt: after.updatedAt?.toDate() || new Date(),
        });
        
        console.log(`Status update notification sent for complaint ${complaintId}`);
      } catch (error) {
        console.error('Error sending status update notification:', error);
      }
    }
  });

// Trigger when user status is updated (approval/rejection)
export const onUserStatusUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;
    
    // Check if status was updated
    if (before.status !== after.status) {
      try {
        if (after.status === 'approved') {
          await sendEmail(after.email, 'user_approved', {
            fullName: after.fullName,
            role: after.role,
          });
        } else if (after.status === 'rejected') {
          await sendEmail(after.email, 'user_rejected', {
            fullName: after.fullName,
            role: after.role,
          });
        }
        
        console.log(`User status notification sent for user ${userId}`);
      } catch (error) {
        console.error('Error sending user status notification:', error);
      }
    }
  });
