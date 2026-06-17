import * as auditService from "./audit.service.js";

export const fetchAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1);

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    const logs = await auditService.getAuditLogs({ page, limit });
    return res.status(200).json({
      success: true,
      page,
      limit,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
export const createAuditLogs = async (req, res, next) => {
  try {
    const log = await auditService.createAuditLogs({
      user_id,
      org_id,
      email,
      role_name,
      action,
    });
    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};
