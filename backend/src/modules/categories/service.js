const prisma = require('../../config/database');
const { NotFoundError } = require('../../utils/errors');
const { createAuditLog } = require('../../utils/auditLogger');

class CategoryService {
  async list({ activeOnly = false } = {}) {
    const where = activeOnly ? { isActive: true } : {};
    return prisma.category.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async create(data, adminId, ipAddress) {
    const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const category = await prisma.category.create({
      data: { name: data.name, description: data.description, sortOrder: (maxSort._max.sortOrder || 0) + 1 },
    });
    await createAuditLog({ action: 'CATEGORY_CREATED', userId: adminId, entityType: 'Category', entityId: category.id, newValue: { name: category.name }, ipAddress });
    return category;
  }

  async update(id, data, adminId, ipAddress) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Category');

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    await createAuditLog({ action: 'CATEGORY_UPDATED', userId: adminId, entityType: 'Category', entityId: id, oldValue: { name: existing.name, isActive: existing.isActive }, newValue: updateData, ipAddress });
    return category;
  }

  async deactivate(id, adminId, ipAddress) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category');
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    await createAuditLog({ action: 'CATEGORY_DEACTIVATED', userId: adminId, entityType: 'Category', entityId: id, ipAddress });
  }
}

module.exports = new CategoryService();
