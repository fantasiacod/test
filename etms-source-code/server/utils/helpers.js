/**
 * Utility Helper Functions
 */

/**
 * Calculate end date from start date + work days (skipping Fri/Sat weekends)
 * @param {string|Date} startDate - Start date
 * @param {number} workDays - Number of working days
 * @returns {Date} Calculated end date
 */
function calculateEndDate(startDate, workDays) {
    const start = new Date(startDate);
    let daysAdded = 0;
    const result = new Date(start);
    while (daysAdded < workDays) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Skip Friday and Saturday
            daysAdded++;
        }
    }
    return result;
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

/**
 * Get pagination parameters from query string
 * @param {object} query - Request query params
 * @returns {{ page: number, limit: number, offset: number }}
 */
function getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

/**
 * Build pagination response metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object}
 */
function buildPaginationMeta(total, page, limit) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Get client IP address from request
 * @param {object} req - Express request
 * @returns {string}
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

module.exports = {
    calculateEndDate,
    formatDate,
    getPaginationParams,
    buildPaginationMeta,
    getClientIp
};
