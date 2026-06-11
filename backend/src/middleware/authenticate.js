const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        status: true,
        teamId: true,
        team: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status === 'DISABLED') {
      throw new UnauthorizedError('Account has been disabled');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    next(error);
  }
}

module.exports = { authenticate };
