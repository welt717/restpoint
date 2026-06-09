class EmailService {
  async sendWelcomeEmail(to: string, organizationName: string, adminEmail: string): Promise<void> {
    console.log(`📧 Welcome email would be sent to: ${to}`);
    console.log(`   Organization: ${organizationName}`);
    console.log(`   Admin: ${adminEmail}`);
    // In production, implement actual email sending here
  }
}

export default new EmailService();
