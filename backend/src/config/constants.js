// Valid status transitions map
const STATUS_TRANSITIONS = {
  OPEN: ['IN_DISCUSSION', 'BLOCKED', 'RESOLVED'],
  IN_DISCUSSION: ['BLOCKED', 'RESOLVED'],
  BLOCKED: ['IN_DISCUSSION', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: ['OPEN'], // Reopen - admin only
};

// Allowed file types for uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg'];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB

const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

module.exports = {
  STATUS_TRANSITIONS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  PAGINATION_DEFAULTS,
};
