const APPROVED_REVIEWS_KEY = 'reviews:approved:v1';
const PENDING_REVIEWS_KEY = 'reviews:pending:v1';

const getKvConfig = () => ({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const hasKvConfig = () => {
    const { url, token } = getKvConfig();
    return Boolean(url && token);
};

const runKvPipeline = async commands => {
    const { url, token } = getKvConfig();
    if (!url || !token) {
        throw new Error('Vercel KV nie je nakonfigurované.');
    }

    const response = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
    });

    const payload = await response.json();

    if (!response.ok) {
        const message = payload && payload.error ? payload.error : 'Volanie Vercel KV zlyhalo.';
        throw new Error(message);
    }

    if (!Array.isArray(payload)) {
        throw new Error('Neočakávaná odpoveď z Vercel KV.');
    }

    payload.forEach(item => {
        if (item && item.error) {
            throw new Error(item.error);
        }
    });

    return payload.map(item => (item ? item.result : null));
};

const readJsonArray = async key => {
    const [rawValue] = await runKvPipeline([['GET', key]]);

    if (!rawValue) {
        return [];
    }

    try {
        const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const writeJsonArray = async (key, values) => {
    await runKvPipeline([['SET', key, JSON.stringify(values)]]);
};

const readReviews = async () => {
    const [approved, pending] = await Promise.all([
        readJsonArray(APPROVED_REVIEWS_KEY),
        readJsonArray(PENDING_REVIEWS_KEY),
    ]);

    return { approved, pending };
};

const writeReviews = async ({ approved, pending }) => {
    await runKvPipeline([
        ['SET', APPROVED_REVIEWS_KEY, JSON.stringify(Array.isArray(approved) ? approved : [])],
        ['SET', PENDING_REVIEWS_KEY, JSON.stringify(Array.isArray(pending) ? pending : [])],
    ]);
};

module.exports = {
    hasKvConfig,
    readReviews,
    writeReviews,
};
