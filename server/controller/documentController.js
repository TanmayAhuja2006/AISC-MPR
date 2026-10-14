const path           = require('path');
const fs             = require('fs');
const axios          = require('axios');
const FormData       = require('form-data');
const DocumentModel  = require('../models/documentModel');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * documentController.js
 * Handles medical document upload, indexing via FastAPI, and listing.
 */

// POST /api/documents/upload
const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const { originalname, filename, path: filePath, size, mimetype } = req.file;

  // Save record to DB (not yet indexed)
  const docId = await DocumentModel.create({
    userId:       req.user.id,
    originalName: originalname,
    storedName:   filename,
    filePath,
    fileSize:     size,
    mimeType:     mimetype,
  });

  // Forward file to FastAPI for FAISS indexing
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename:    originalname,
      contentType: mimetype,
    });
    form.append('user_id', String(req.user.id));
    form.append('doc_id',  String(docId));

    await axios.post(`${AI_URL}/api/upload-doc`, form, {
      headers: form.getHeaders(),
      timeout: 120000,
    });

    await DocumentModel.markIndexed(docId);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and indexed successfully.',
      document: {
        id:           docId,
        originalName: originalname,
        fileSize:     size,
        mimeType:     mimetype,
        indexed:      true,
      },
    });
  } catch (err) {
    console.error('[documentController] AI indexing error:', err.message);
    // Document saved, but not indexed yet
    return res.status(202).json({
      success: true,
      message: 'Document saved but indexing is pending. It will be indexed automatically.',
      document: {
        id:           docId,
        originalName: originalname,
        fileSize:     size,
        mimeType:     mimetype,
        indexed:      false,
      },
    });
  }
};

// GET /api/documents
const getDocuments = async (req, res) => {
  const docs = await DocumentModel.getByUser(req.user.id);
  return res.status(200).json({ success: true, documents: docs });
};

// DELETE /api/documents/:docId
const deleteDocument = async (req, res) => {
  const { docId } = req.params;
  const doc = await DocumentModel.getById(docId, req.user.id);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found.' });
  }

  // Remove file from disk
  if (fs.existsSync(doc.file_path)) {
    fs.unlinkSync(doc.file_path);
  }

  await DocumentModel.delete(docId, req.user.id);
  return res.status(200).json({ success: true, message: 'Document deleted.' });
};

module.exports = { uploadDocument, getDocuments, deleteDocument };
