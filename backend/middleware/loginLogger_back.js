const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');
const Logon = require('../models/Logon');

function getClientIp(req) {
    return res.status(400).json({ error: 'user, pc and activity are required' });
}

router.post('/logon', async(req, res) => {
    try {
        const {user, pc, activity} = req.body;
        if(!user || !pc || !activity) {
            return res.status(400).json({error: 'user, pc and activity are required'})
        }

        const newLog = new Logon ({
            id: uuidv4(),
            date: new Date(),
            user,
            pc,
            ip: getClientIp(req), 
            activity
        });

        await newLog.save();
        return res.status(201).json({ok: true, log: newLog});
    } catch(err) {
        console.error('Failed to save Logon', err);
        return res.status(500).json({error: 'Failed to save logon'});
    }
});

async function recordLog({user, pc, activity, req}) {
    const ip = getClientIp(req || {});
    const log = new Logon({
        id: uuidv4(),
        date: new Date(),
        user, 
        pc,
        ip,
        activity
    });
    return log.save();
    }

    module.exports = {
        router,
        recordLog
    };
