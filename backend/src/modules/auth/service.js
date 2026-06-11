const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const { UnauthorizedError, ValidationError } = require('../../utils/errors');
const { createAuditLog } = require('../../utils/auditLogger');

class AuthService {
  generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  async login(email, password, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { team: { select: { id: true, name: true } } },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'DISABLED') {
      throw new UnauthorizedError('Account has been disabled. Contact your administrator.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    await createAuditLog({
      action: 'USER_LOGIN',
      userId: user.id,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    const { passwordHash, ...userData } = user;
    return { user: userData, accessToken, refreshToken };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { team: { select: { id: true, name: true } } },
    });

    if (!user || user.status === 'DISABLED') {
      throw new UnauthorizedError('Account unavailable');
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = this.generateAccessToken(user.id);
    const newRefreshToken = this.generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const { passwordHash, ...userData } = user;
    return { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken, userId) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    await createAuditLog({
      action: 'USER_LOGOUT',
      userId,
      entityType: 'User',
      entityId: userId,
    });
  }

  async changePassword(userId, currentPassword, newPassword, ipAddress) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await createAuditLog({
      action: 'PASSWORD_CHANGED',
      userId,
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });
  }
}

module.exports = new AuthService();
