const { getBearerToken, parseJsonBody, safeEqual, sendJson } = require('../_lib/http');
const { hasKvConfig, readReviews, writeReviews } = require('../_lib/reviewStore');

const ADMIN_TOKEN = process.env.REVIEWS_ADMIN_TOKEN || '';

const isAuthorized = req => {
    if (!ADMIN_TOKEN) {
        return false;
    }

    const bearerToken = getBearerToken(req);
    return safeEqual(bearerToken, ADMIN_TOKEN);
};

const sortByCreatedAtDesc = reviews =>
    [...reviews].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
    });

module.exports = async (req, res) => {
    if (!hasKvConfig()) {
        return sendJson(res, 503, {
            ok: false,
            error: 'Vercel KV nie je nakonfigurované.',
        });
    }

    if (!isAuthorized(req)) {
        return sendJson(res, 401, {
            ok: false,
            error: 'Neautorizovaný prístup.',
        });
    }

    if (req.method === 'GET') {
        try {
            const { pending } = await readReviews();
            const pendingReviews = sortByCreatedAtDesc(pending).map(review => ({
                id: review.id,
                stars: review.stars,
                name: review.name,
                description: review.description,
                createdAt: review.createdAt || '',
            }));

            return sendJson(res, 200, {
                ok: true,
                pending: pendingReviews,
            });
        } catch (error) {
            return sendJson(res, 500, {
                ok: false,
                error: 'Nepodarilo sa načítať čakajúce recenzie.',
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const action = String(body.action || '').trim().toLowerCase();
            const reviewId = String(body.id || '').trim();

            if (!reviewId) {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Chýba identifikátor recenzie.',
                });
            }

            if (action !== 'approve' && action !== 'reject') {
                return sendJson(res, 400, {
                    ok: false,
                    error: 'Neplatná akcia.',
                });
            }

            const { approved, pending } = await readReviews();
            const pendingIndex = pending.findIndex(review => review && review.id === reviewId);

            if (pendingIndex === -1) {
                return sendJson(res, 404, {
                    ok: false,
                    error: 'Recenzia sa medzi čakajúcimi nenašla.',
                });
            }

            const pendingReview = pending[pendingIndex];
            const updatedPending = pending.filter(review => review.id !== reviewId);
            const updatedApproved = [...approved];

            if (action === 'approve') {
                updatedApproved.push({
                    ...pendingReview,
                    approvedAt: new Date().toISOString(),
                });
            }

            await writeReviews({
                approved: updatedApproved,
                pending: updatedPending,
            });

            return sendJson(res, 200, {
                ok: true,
                action,
                id: reviewId,
            });
        } catch (error) {
            return sendJson(res, 500, {
                ok: false,
                error: 'Akciu nad recenziou sa nepodarilo vykonať.',
            });
        }
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, {
        ok: false,
        error: 'Metóda nie je povolená.',
    });
};
