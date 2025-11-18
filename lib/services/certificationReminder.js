import { connectDB } from '@/lib/db/mongodb';
import { Certification } from '@/lib/models/Certification';
import { Employee } from '@/lib/models/Employee';

/**
 * Certification Reminder Service
 * 
 * Purpose: Send reminders for certifications expiring within 30 days
 * 
 * This service should be run daily (via cron job or scheduled task)
 * 
 * Usage:
 * - Call checkExpiringCertifications() daily
 * - In production, this would send emails/notifications
 */
export async function checkExpiringCertifications() {
  try {
    await connectDB();

    // Find certifications expiring in the next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + 30);
    expiryThreshold.setHours(23, 59, 59, 999);

    const expiringCertifications = await Certification.find({
      expiryDate: {
        $gte: today,
        $lte: expiryThreshold,
      },
      status: { $in: ['valid', 'pending_validation'] },
    })
      .populate('employeeId', 'firstName lastName email phone')
      .lean();

    const reminders = [];

    for (const cert of expiringCertifications) {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expiryDate) - today) / (1000 * 60 * 60 * 24)
      );

      reminders.push({
        certification: cert,
        employee: cert.employeeId,
        daysUntilExpiry,
        expiryDate: cert.expiryDate,
        type: cert.type,
      });
    }

    // In production, send emails/notifications here
    // For now, we'll just return the reminders
    return {
      success: true,
      count: reminders.length,
      reminders,
    };
  } catch (error) {
    console.error('Error checking expiring certifications:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get certifications expiring soon for a specific employee
 */
export async function getExpiringCertificationsForEmployee(employeeId) {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + 30);
    expiryThreshold.setHours(23, 59, 59, 999);

    const certifications = await Certification.find({
      employeeId,
      expiryDate: {
        $gte: today,
        $lte: expiryThreshold,
      },
      status: { $in: ['valid', 'pending_validation'] },
    }).lean();

    return certifications.map((cert) => ({
      ...cert,
      daysUntilExpiry: Math.ceil(
        (new Date(cert.expiryDate) - today) / (1000 * 60 * 60 * 24)
      ),
    }));
  } catch (error) {
    console.error('Error fetching expiring certifications:', error);
    return [];
  }
}

/**
 * API endpoint to check expiring certifications
 * This can be called by a cron job or scheduled task
 */
export async function sendExpiryReminders() {
  const result = await checkExpiringCertifications();

  if (result.success) {
    console.log(`Found ${result.count} certifications expiring soon`);

    // In production, send emails/notifications here
    // Example:
    // for (const reminder of result.reminders) {
    //   await sendEmail({
    //     to: reminder.employee.email,
    //     subject: `Certification Expiring: ${reminder.type}`,
    //     body: `Your ${reminder.type} certification expires in ${reminder.daysUntilExpiry} days.`,
    //   });
    // }
  }

  return result;
}

