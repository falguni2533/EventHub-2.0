import {
  buildCertificatePDF,
  generateCertificateForParticipant,
  generateCertificatesForEvent,
  getEventsWithCertificateParticipants,
  getStudentCertificateById,
  listAllCertificates,
  listStudentCertificates,
  resolveClientUrl,
  revokeCertificateById,
  verifyCertificatePublic,
} from '../services/certificateService.js';

/**
 * GET /api/student/certificates
 */
export const getMyCertificates = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const certs = await listStudentCertificates(req.user.id, clientUrl);
    res.status(200).json({
      success: true,
      count: certs.length,
      data: certs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/certificates/:certificateId
 */
export const getMyCertificateDetail = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const cert = await getStudentCertificateById(
      req.params.certificateId,
      req.user.id,
      clientUrl
    );
    res.status(200).json({
      success: true,
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/certificates
 */
export const getCertificates = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const certs = await listAllCertificates(req.query, clientUrl);
    res.status(200).json({
      success: true,
      count: certs.length,
      data: certs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/certificates/events
 */
export const getEventsAndParticipants = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const data = await getEventsWithCertificateParticipants(clientUrl);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/certificates/generate/:eventId
 */
export const generateEventCertificates = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const result = await generateCertificatesForEvent(
      req.params.eventId,
      req.user.id,
      clientUrl
    );
    res.status(201).json({
      success: true,
      message: `Certificate generation completed for ${result.eventName}.`,
      summary: result.summary,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/certificates/generate-single
 */
export const generateSingleCertificate = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const result = await generateCertificateForParticipant(
      req.body,
      req.user.id,
      clientUrl
    );

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: result.message,
        data: result.data,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Certificate generated successfully.',
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/admin/certificates/revoke/:certificateId
 */
export const revokeCertificate = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const updated = await revokeCertificateById(
      req.params.certificateId,
      req.body?.reason,
      req.user.id,
      clientUrl
    );
    res.status(200).json({
      success: true,
      message: `Certificate ${updated.certificateId} has been revoked.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/certificates/verify/:certificateId
 * Public sanitized verification endpoint
 */
export const verifyCertificate = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const result = await verifyCertificatePublic(req.params.certificateId, clientUrl);

    if (!result) {
      return res.status(404).json({
        success: false,
        valid: false,
        message:
          'Certificate Not Found. This certificate ID could not be verified in the EventHub registry.',
      });
    }

    return res.status(200).json({
      success: true,
      valid: result.valid,
      status: result.status,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/certificates/download/:certificateId
 */
export const downloadCertificate = async (req, res, next) => {
  try {
    const clientUrl = resolveClientUrl(req);
    const { cert, doc } = await buildCertificatePDF(req.params.certificateId, clientUrl);
    const filename = `EventHub_Certificate_${cert.certificateId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};
