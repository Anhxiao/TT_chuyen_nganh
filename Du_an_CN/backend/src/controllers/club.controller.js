
const clubService = require('../services/club.service');

const clubController = {
    // GET /api/clubs
    async getClubs(req, res, next) {
        try {
            const data = await clubService.getActiveClubs(
                req.user.userId
            );

            return res.status(200).json({
                success: true,
                message: 'Lấy danh sách câu lạc bộ thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/clubs/:clubId/apply
    async apply(req, res, next) {
        try {
            const data = await clubService.apply(
                req.user.userId,
                {
                    clubId: req.params.clubId,
                    reason: req.body.reason,
                    introduction: req.body.introduction,
                    skills: req.body.skills
                }
            );

            return res.status(201).json({
                success: true,
                message: 'Đã gửi đơn đăng ký thành viên câu lạc bộ.',
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/clubs/my-requests
    async getMyRequests(req, res, next) {
        try {
            const data = await clubService.getMyRequests(
                req.user.userId
            );

            return res.status(200).json({
                success: true,
                message: 'Lấy lịch sử đăng ký câu lạc bộ thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/clubs/membership-requests
    async getClubRequests(req, res, next) {
        try {
            const data = await clubService.getClubRequests(
                req.user.userId,
                req.query.status
            );

            return res.status(200).json({
                success: true,
                message: 'Lấy danh sách đơn đăng ký thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/clubs/membership-requests/:requestId/review
    async review(req, res, next) {
        try {
            const data = await clubService.review(
                req.user.userId,
                req.params.requestId,
                req.body
            );

            return res.status(200).json({
                success: true,
                message: data.status === 'APPROVED'
                    ? 'Đã chấp nhận đơn đăng ký thành viên.'
                    : 'Đã từ chối đơn đăng ký thành viên.',
                data
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = clubController;
