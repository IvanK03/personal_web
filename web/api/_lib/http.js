const { timingSafeEqual } = require('crypto');

const sendJson = (res, statusCode, payload) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
};

const parseJsonBody = async req => {
    if (!req.body) {
        return {};
    }

    if (typeof req.body === 'object') {
        return req.body;
    }

    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }

    if (!chunks.length) {
        return {};
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
        return {};
    }
};

const getBearerToken = req => {
    const headerValue = req.headers.authorization || '';
    if (!headerValue.startsWith('Bearer ')) {
        return '';
    }
    return headerValue.slice('Bearer '.length).trim();
};

const safeEqual = (valueA, valueB) => {
    if (!valueA || !valueB) {
        return false;
    }

    const a = Buffer.from(String(valueA));
    const b = Buffer.from(String(valueB));

    if (a.length !== b.length) {
        return false;
    }

    return timingSafeEqual(a, b);
};

const getClientIp = req => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }

    if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
    }

    return '';
};

module.exports = {
    getBearerToken,
    getClientIp,
    parseJsonBody,
    safeEqual,
    sendJson,
};
