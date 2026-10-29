
function validateActivity(req, res, next) {
    const data = req.body || {};
    const errors = {};

    const isUpdate = req.method === 'PUT';

    const requiredFields = [
        'activityName',
        'organizationId',
        'location',
        'registrationStart',
        'registrationEnd',
        'activityStart',
        'activityEnd'
    ];

    if (!isUpdate) {
        for (const field of requiredFields) {
            const value = data[field];

            if (
                value === undefined ||
                value === null ||
                (typeof value === 'string' && !value.trim())
            ) {
                errors[field] = `Trường ${field} không được để trống.`;
            }
        }
    }

    if (data.activityName !== undefined) {
        if (
            typeof data.activityName !== 'string' ||
            !data.activityName.trim()
        ) {
            errors.activityName = 'Tên hoạt động không hợp lệ.';
        } else if (data.activityName.trim().length > 255) {
            errors.activityName = 'Tên hoạt động quá dài.';
        }
    }

    if (data.organizationId !== undefined) {
        const organizationId = Number(data.organizationId);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            errors.organizationId = 'Mã đơn vị tổ chức không hợp lệ.';
        }
    }

    if (data.maxParticipants !== undefined &&
        data.maxParticipants !== null &&
        data.maxParticipants !== '') {
        const maxParticipants = Number(data.maxParticipants);

        if (!Number.isInteger(maxParticipants) || maxParticipants < 1) {
            errors.maxParticipants =
                'Số lượng người tham gia phải là số nguyên lớn hơn 0.';
        }
    }

    const dateFields = [
        'registrationStart',
        'registrationEnd',
        'activityStart',
        'activityEnd'
    ];

    for (const field of dateFields) {
        if (data[field] !== undefined) {
            const value = data[field];

            if (
                typeof value !== 'string' ||
                !value.trim() ||
                Number.isNaN(Date.parse(value))
            ) {
                errors[field] = `Trường ${field} không phải ngày giờ hợp lệ.`;
            }
        }
    }

    if (
        data.registrationStart &&
        data.registrationEnd &&
        Date.parse(data.registrationStart) >=
            Date.parse(data.registrationEnd)
    ) {
        errors.registrationEnd =
            'Thời gian kết thúc đăng ký phải sau thời gian bắt đầu.';
    }

    if (
        data.activityStart &&
        data.activityEnd &&
        Date.parse(data.activityStart) >= Date.parse(data.activityEnd)
    ) {
        errors.activityEnd =
            'Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.';
    }

    if (
        data.registrationEnd &&
        data.activityStart &&
        Date.parse(data.registrationEnd) > Date.parse(data.activityStart)
    ) {
        errors.registrationEnd =
            'Đăng ký phải kết thúc trước hoặc tại thời điểm hoạt động bắt đầu.';
    }

    if (
        data.registrationMode !== undefined &&
        !['OPEN', 'APPROVAL'].includes(data.registrationMode)
    ) {
        errors.registrationMode =
            'Hình thức đăng ký chỉ được là OPEN hoặc APPROVAL.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu hoạt động không hợp lệ.',
            errors
        });
    }

    next();
}

module.exports = {
    validateActivity
};
