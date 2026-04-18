const { randomUUID } = require('crypto');
const { getClientIp, parseJsonBody, sendJson } = require('../_lib/http');
const { hasKvConfig, readReviews, writeReviews } = require('../_lib/reviewStore');

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

const sanitizeReviewInput = payload => {
    const stars = Number(payload.stars);
    const name = String(payload.name || '').trim();
    const description = String(payload.description || '').trim();

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return { error: 'Neplatný počet hviezdičiek.' };
    }

    if (!name) {
        return { error: 'Meno je povinné.' };
    }

    if (!description) {
        return { error: 'Text recenzie je povinný.' };
    }

    if (name.length > MAX_NAME_LENGTH) {
        return { error: 'Meno je príliš dlhé.' };
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
        return { error: 'Recenzia je príliš dlhá.' };
    }

    return { stars, name, description };
};

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        if (!hasKvConfig()) {
            return sendJson(res, 200, {
                ok: true,
                reviews: [],
            });
        }

        try {
            const { approved } = await readReviews();
            const publicReviews = approved
                .filter(review => review && review.id && review.name && review.description)
                .map(review => ({
                    id: review.id,
                    stars: review.stars,
                    name: review.name,
                    description: review.description,
                    approvedAt: review.approvedAt || '',
                }));

            return sendJson(res, 200, {
                ok: true,
                reviews: publicReviews,
            });
        } catch (error) {
            return sendJson(res, 500, {
                ok: false,
                error: 'Nepodarilo sa načítať recenzie.',
            });
        }
    }

    if (req.method === 'POST') {
        if (!hasKvConfig()) {
            return sendJson(res, 503, {
                ok: false,
                error: 'Recenzie nie sú ešte nakonfigurované na serveri.',
            });
        }

        try {
            const body = await parseJsonBody(req);
            const sanitized = sanitizeReviewInput(body);

            if (sanitized.error) {
                return sendJson(res, 400, {
                    ok: false,
                    error: sanitized.error,
                });
            }

            const { approved, pending } = await readReviews();
            const nowIso = new Date().toISOString();
            const createdReview = {
                id: randomUUID(),
                stars: sanitized.stars,
                name: sanitized.name,
                description: sanitized.description,
                createdAt: nowIso,
                sourceIp: getClientIp(req),
            };

            const updatedPending = [createdReview, ...pending].slice(0, 1000);

            await writeReviews({
                approved,
                pending: updatedPending,
            });

            return sendJson(res, 201, {
                ok: true,
                reviewId: createdReview.id,
                message: 'Recenzia bola odoslaná na schválenie.',
            });
        } catch (error) {
            return sendJson(res, 500, {
                ok: false,
                error: 'Recenziu sa nepodarilo uložiť.',
            });
        }
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, {
        ok: false,
        error: 'Metóda nie je povolená.',
    });
};
