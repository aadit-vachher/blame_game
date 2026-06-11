const path = require('path');
const fs = require('fs');
const prisma = require('../../config/database');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { createAuditLog } = require('../../utils/auditLogger');

class AttachmentService {
  async upload(file, user, { blameId, messageId, dependencyId }) {
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploaderId: user.id,
        blameId: blameId || null,
        messageId: messageId || null,
        dependencyId: dependencyId || null,
      },
    });

    await createAuditLog({
      action: 'FILE_UPLOADED',
      userId: user.id,
      entityType: 'Attachment',
      entityId: attachment.id,
      newValue: { fileName: file.originalname, sizeBytes: file.size, blameId },
    });

    return attachment;
  }

  async download(id) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError('Attachment');

    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', attachment.fileName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('File not found on disk');
    }

    return { attachment, filePath };
  }

  async delete(id, user) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError('Attachment');

    if (attachment.uploaderId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('Only the uploader or an admin can delete this attachment');
    }

    // Delete file from disk
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', attachment.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.attachment.delete({ where: { id } });

    await createAuditLog({
      action: 'FILE_DELETED',
      userId: user.id,
      entityType: 'Attachment',
      entityId: id,
      oldValue: { fileName: attachment.originalName },
    });
  }
}

module.exports = new AttachmentService();
