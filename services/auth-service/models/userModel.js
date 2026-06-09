const bcrypt = require('bcryptjs');
const { safeQuery, safeQueryOne } = require('../config/database');

class User {
  // Find user by email
  static async findByEmail(email) {
    return await safeQueryOne(
      `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );
  }

  // Find user by username
  static async findByUsername(username) {
    return await safeQueryOne(
      `SELECT * FROM users WHERE name = ? AND deleted_at IS NULL`,
      [username]
    );
  }

  // Find user by ID
  static async findById(userId) {
    return await safeQueryOne(
      `SELECT * FROM users WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );
  }

  // Create new user
  static async create(userData) {
    const {
      email,
      password_hash,
      name,
      role = 'user',
      tenant_id = null,
      is_tenant_admin = false
    } = userData;

    const result = await safeQuery(
      `INSERT INTO users (email, password_hash, name, role, tenant_id, is_tenant_admin) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase(), password_hash, name, role, tenant_id, is_tenant_admin]
    );
    
    return result.insertId;
  }

  // Check if email exists
  static async emailExists(email) {
    const result = await safeQueryOne(
      'SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL',
      [email.toLowerCase()]
    );
    return !!result;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login
  static async updateLastLogin(userId) {
    await safeQuery(
      'UPDATE users SET last_login_at = NOW() WHERE user_id = ?',
      [userId]
    );
  }

  // Get all users
  static async getAll() {
    return await safeQuery(
      `SELECT user_id, email, name, role, is_active, last_login_at, created_at, tenant_id, is_tenant_admin
       FROM users 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC`
    );
  }

  // Update user status
  static async updateStatus(userId, isActive) {
    await safeQuery(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?',
      [isActive, userId]
    );
  }

  // Update password
  static async updatePassword(userId, newPasswordHash) {
    await safeQuery(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
      [newPasswordHash, userId]
    );
  }

  // Delete user (soft delete)
  static async deleteUser(userId) {
    await safeQuery(
      'UPDATE users SET deleted_at = NOW(), is_active = false WHERE user_id = ?',
      [userId]
    );
  }
}

module.exports = User;