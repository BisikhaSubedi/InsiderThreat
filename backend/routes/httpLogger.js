const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');
const HttpLog = require('../models/HttpLogSchema')

function getClientIp(req) {
    return (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').split(',')[0].trim();
}

router.post('/http-log', async(req, res) => {
    try {
        const {
            id,
            date,
            user,
            pc,
            url,
            method,
            referrer,
            user_agent,
            src_ip,
            dst_ip,
            response_code,
            bytes,
            raw
        } = req.body;

    if(!user || !url) {
         return res.status(400).json({ error: 'user and url are required' });
    }
     const doc = new HttpLog({
      id: id || uuidv4(),
      date: date ? new Date(date) : new Date(),
      user,
      pc,
      url,
      method,
      referrer,
      user_agent,
      src_ip: src_ip || getClientIp(req),
      dst_ip,
      response_code: response_code ? Number(response_code) : undefined,
      bytes: bytes ? Number(bytes) : undefined,
      raw: raw || {}
    });

    await doc.save();
    return res.status(201).json({ ok: true, log: doc });
  } catch (err) {
    console.error('Error saving http log:', err);
    return res.status(500).json({ error: 'failed to save http log' });
  }
});

module.exports = router;
