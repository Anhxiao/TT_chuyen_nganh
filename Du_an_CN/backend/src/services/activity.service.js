const crypto = require('crypto');
const activityRepository = require('../repositories/activity.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function generateActivityCode() {
    const date = new Date();
    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('');

    const randomPart = crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase();

    return `ACT-${datePart}-${randomPart}`;
}

function validateActivityData(data, isUpdate = false) {
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
            if (data[field] === undefined || data[field] === null ||
                String(data[field]).trim() === '') {
                throw createError(`Trường ${field} không được để trống.`);
            }
        }
    }

    if (data.maxParticipants !== undefined &&
        data.maxParticipants !== null &&
        (!Number.isInteger(Number(data.maxParticipants)) ||
            Number(data.maxParticipants) < 1)) {
        throw createError('Số lượng người tham gia tối đa phải lớn hơn 0.');
    }

    const dates = [
        data.registrationStart,
        data.registrationEnd,
        data.activityStart,
        data.activityEnd
    ];

    const suppliedDates = dates.filter(value => value !== undefined);

    for (const value of suppliedDates) {
        if (Number.isNaN(Date.parse(value))) {
            throw createError('Ngày hoặc giờ hoạt động không hợp lệ.');
        }
    }

    if (data.registrationStart && data.registrationEnd &&
        new Date(data.registrationStart) >= new Date(data.registrationEnd)) {
        throw createError('Thời gian kết thúc đăng ký phải sau thời gian bắt đầu.');
    }

    if (data.activityStart && data.activityEnd &&
        new Date(data.activityStart) >= new Date(data.activityEnd)) {
        throw createError('Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.');
    }

    if (data.registrationEnd && data.activityStart &&
        new Date(data.registrationEnd) > new Date(data.activityStart)) {
        throw createError('Thời gian đăng ký không được kết thúc sau khi hoạt động bắt đầu.');
    }

    if (data.registrationMode &&
        !['OPEN', 'APPROVAL'].includes(data.registrationMode)) {
        throw createError('Hình thức đăng ký không hợp lệ.');
    }
}

async function getActivities({
    keyword,
    status,
    organizationId,
    page = 1,
    limit = 20,
    currentUser
}) {
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw createError('Thông tin phân trang không hợp lệ.');
    }

    // Người chưa đăng nhập chỉ được xem hoạt động đã công bố.
    const effectiveStatus = currentUser ? status : (status || 'PUBLISHED');

    return activityRepository.getActivities({
        keyword,
        status: effectiveStatus,
        organizationId,
        page,
        limit
    });
}

async function getActivityById({ activityId, currentUser }) {
    const activity = await activityRepository.findById(activityId);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    // Bảo đảm người chưa đăng nhập không xem được hoạt động chưa công bố.
    if (!currentUser && activity.status !== 'PUBLISHED') {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    return activity;
}

async function createActivity({ data, actorId }) {
    validateActivityData(data);

    const organizationId = Number(data.organizationId);

    if (!Number.isSafeInteger(organizationId) || organizationId <= 0) {
        throw createError('Đơn vị tổ chức không hợp lệ.');
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        organizationId
    );

    if (!isMember) {
        throw createError(
            'Bạn không thuộc đơn vị tổ chức này.',
            403
        );
    }

    const activity = await activityRepository.createActivity({
        activityCode: generateActivityCode(),
        organizationId,
        activityName: data.activityName.trim(),
        description: data.description?.trim() || null,
        location: data.location.trim(),
        registrationStart: data.registrationStart,
        registrationEnd: data.registrationEnd,
        activityStart: data.activityStart,
        activityEnd: data.activityEnd,
        maxParticipants: data.maxParticipants ?? null,
        registrationMode: data.registrationMode || 'OPEN',
        createdBy: actorId
    });

    return activity;
}

async function updateActivity({ activityId, data, actorId }) {
    const existing = await activityRepository.findById(activityId);

    if (!existing) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    if (existing.status !== 'DRAFT') {
        throw createError(
            'Chỉ được chỉnh sửa hoạt động ở trạng thái bản nháp.',
            409
        );
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        existing.organization_id
    );

    if (!isMember) {
        throw createError(
            'Bạn không có quyền chỉnh sửa hoạt động này.',
            403
        );
    }

    // Kết hợp dữ liệu mới với dữ liệu hiện có để kiểm tra đầy đủ.
    const mergedData = {
        activityName: data.activityName ?? existing.activity_name,
        organizationId: existing.organization_id,
        location: data.location ?? existing.location,
        registrationStart:
            data.registrationStart ?? existing.registration_start,
        registrationEnd:
            data.registrationEnd ?? existing.registration_end,
        activityStart:
            data.activityStart ?? existing.activity_start,
        activityEnd:
            data.activityEnd ?? existing.activity_end,
        maxParticipants:
            data.maxParticipants ?? existing.max_participants,
        registrationMode:
            data.registrationMode ?? existing.registration_mode
    };

    validateActivityData(mergedData);

    const updated = await activityRepository.updateActivity(
        activityId,
        {
            activityName: data.activityName,
            description: data.description,
            location: data.location,
            registrationStart: data.registrationStart,
            registrationEnd: data.registrationEnd,
            activityStart: data.activityStart,
            activityEnd: data.activityEnd,
            maxParticipants: data.maxParticipants,
            registrationMode: data.registrationMode
        }
    );

    if (!updated) {
        throw createError(
            'Không thể cập nhật hoạt động. Vui lòng tải lại dữ liệu.',
            409
        );
    }

    return activityRepository.findById(activityId);
}

async function publishActivity({ activityId, actorId }) {
    const existing = await activityRepository.findById(activityId);

    if (!existing) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    if (existing.status !== 'DRAFT') {
        throw createError('Chỉ được công bố hoạt động ở trạng thái bản nháp.', 409);
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        existing.organization_id
    );

    if (!isMember) {
        throw createError('Bạn không có quyền công bố hoạt động này.', 403);
    }

    await activityRepository.publishActivity(activityId);

    return activityRepository.findById(activityId);
}

module.exports = {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    publishActivity
};