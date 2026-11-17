
const clubRepository = require('../repositories/club.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function validateId(value, fieldName) {
    const id = String(value ?? '');

    if (!/^[1-9]\d{0,17}$/.test(id)) {
        throw createError(`${fieldName} không hợp lệ.`);
    }

    return id;
}

const clubService = {
    async getActiveClubs(userId) {
        return clubRepository.getActiveClubs(userId);
    },

    async apply(userId, data) {
        const clubId = validateId(data.clubId, 'Mã câu lạc bộ');

        const reason = typeof data.reason === 'string'
            ? data.reason.trim()
            : '';

        if (!reason || reason.length > 1000) {
            throw createError(
                'Lý do đăng ký không được để trống và tối đa 1000 ký tự.'
            );
        }

        const introduction = data.introduction == null
            ? null
            : String(data.introduction).trim();

        const skills = data.skills == null
            ? null
            : String(data.skills).trim();

        if (introduction && introduction.length > 2000) {
            throw createError('Phần giới thiệu tối đa 2000 ký tự.');
        }

        if (skills && skills.length > 1000) {
            throw createError('Phần kỹ năng tối đa 1000 ký tự.');
        }

        return clubRepository.createMembershipRequest(userId, {
            clubId,
            reason,
            introduction,
            skills
        });
    },

    async getMyRequests(userId) {
        return clubRepository.getMyRequests(userId);
    },

    async getClubRequests(userId, status) {
        const allowedStatuses = [
            'PENDING',
            'APPROVED',
            'REJECTED',
            'CANCELLED'
        ];

        if (status && !allowedStatuses.includes(status)) {
            throw createError('Trạng thái đơn đăng ký không hợp lệ.');
        }

        return clubRepository.getClubRequests(userId, status || null);
    },

    async review(userId, requestId, data) {
        const id = validateId(requestId, 'Mã đơn đăng ký');

        const decision = String(data.decision || '').toUpperCase();

        if (!['APPROVED', 'REJECTED'].includes(decision)) {
            throw createError('Quyết định phải là APPROVED hoặc REJECTED.');
        }

        const reviewNote = data.reviewNote == null
            ? null
            : String(data.reviewNote).trim();

        if (reviewNote && reviewNote.length > 1000) {
            throw createError('Ghi chú xét duyệt tối đa 1000 ký tự.');
        }

        if (decision === 'REJECTED' && !reviewNote) {
            throw createError('Vui lòng nhập lý do từ chối đơn đăng ký.');
        }

        return clubRepository.reviewRequest(
            userId,
            id,
            decision,
            reviewNote
        );
    }
};

module.exports = clubService;
