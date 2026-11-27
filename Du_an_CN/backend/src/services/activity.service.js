
const crypto = require('crypto');
const activityRepository = require('../repositories/activity.repository');

// ======================================================
// 1. HÀM TẠO LỖI
// ======================================================

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// ======================================================
// 2. KIỂM TRA MÃ HOẠT ĐỘNG
// ======================================================

function validateActivityId(activityId) {
    const id = Number(activityId);

    if (
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {
        throw createError('Mã hoạt động không hợp lệ.', 400);
    }

    return id;
}

// ======================================================
// 3. TẠO MÃ HOẠT ĐỘNG
// ======================================================

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

// ======================================================
// 4. KIỂM TRA DỮ LIỆU HOẠT ĐỘNG
// ======================================================

function validateActivityData(data, isUpdate = false) {
    if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data)
    ) {
        throw createError('Dữ liệu hoạt động không hợp lệ.');
    }

    const requiredFields = [
        'activityName',
        'organizationId',
        'location',
        'registrationStart',
        'registrationEnd',
        'activityStart',
        'activityEnd'
    ];

    // --------------------------------------------------
    // 4.1. Kiểm tra trường bắt buộc khi tạo mới
    // --------------------------------------------------

    if (!isUpdate) {
        for (const field of requiredFields) {
            if (
                data[field] === undefined ||
                data[field] === null ||
                String(data[field]).trim() === ''
            ) {
                throw createError(
                    `Trường ${field} không được để trống.`
                );
            }
        }
    }

    // --------------------------------------------------
    // 4.2. Kiểm tra tên hoạt động
    // --------------------------------------------------

    if (
        data.activityName !== undefined &&
        (
            typeof data.activityName !== 'string' ||
            !data.activityName.trim()
        )
    ) {
        throw createError('Tên hoạt động không được để trống.');
    }

    if (
        typeof data.activityName === 'string' &&
        data.activityName.trim().length > 255
    ) {
        throw createError('Tên hoạt động không được vượt quá 255 ký tự.');
    }

    // --------------------------------------------------
    // 4.3. Kiểm tra đơn vị tổ chức
    // --------------------------------------------------

    if (data.organizationId !== undefined) {
        const organizationId = Number(data.organizationId);

        if (
            !Number.isSafeInteger(organizationId) ||
            organizationId <= 0
        ) {
            throw createError('Đơn vị tổ chức không hợp lệ.');
        }
    }

    // --------------------------------------------------
    // 4.4. Kiểm tra địa điểm
    // --------------------------------------------------

    if (
        data.location !== undefined &&
        (
            typeof data.location !== 'string' ||
            !data.location.trim()
        )
    ) {
        throw createError('Địa điểm tổ chức không được để trống.');
    }

    // --------------------------------------------------
    // 4.5. Kiểm tra mô tả
    // --------------------------------------------------

    if (
        data.description !== undefined &&
        data.description !== null &&
        typeof data.description !== 'string'
    ) {
        throw createError('Mô tả hoạt động không hợp lệ.');
    }

    // --------------------------------------------------
    // 4.6. Kiểm tra số lượng người tham gia tối đa
    // --------------------------------------------------

    if (
        data.maxParticipants !== undefined &&
        data.maxParticipants !== null
    ) {
        const maxParticipants = Number(data.maxParticipants);

        if (
            !Number.isSafeInteger(maxParticipants) ||
            maxParticipants < 1 ||
            maxParticipants > 2147483647
        ) {
            throw createError(
                'Số lượng người tham gia tối đa phải là số nguyên lớn hơn 0.'
            );
        }
    }

    // --------------------------------------------------
    // 4.7. Kiểm tra điểm hoạt động
    // --------------------------------------------------

    if (
        data.expectedPoints !== undefined &&
        data.expectedPoints !== null
    ) {
        if (String(data.expectedPoints).trim() === '') {
            throw createError(
                'Điểm cộng khi hoàn thành hoạt động không được để trống.'
            );
        }

        const expectedPoints = Number(data.expectedPoints);

        if (
            !Number.isSafeInteger(expectedPoints) ||
            expectedPoints < 0 ||
            expectedPoints > 2147483647
        ) {
            throw createError(
                'Điểm cộng khi hoàn thành phải là số nguyên không âm.'
            );
        }
    }

    // --------------------------------------------------
    // 4.8. Kiểm tra ngày giờ
    // --------------------------------------------------

    const dateFields = [
        'registrationStart',
        'registrationEnd',
        'activityStart',
        'activityEnd'
    ];

    for (const field of dateFields) {
        const value = data[field];

        if (value === undefined || value === null) {
            continue;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            throw createError(
                `Thời gian ${field} không hợp lệ.`
            );
        }
    }

    const registrationStart = data.registrationStart
        ? new Date(data.registrationStart)
        : null;

    const registrationEnd = data.registrationEnd
        ? new Date(data.registrationEnd)
        : null;

    const activityStart = data.activityStart
        ? new Date(data.activityStart)
        : null;

    const activityEnd = data.activityEnd
        ? new Date(data.activityEnd)
        : null;

    // --------------------------------------------------
    // 4.9. Kiểm tra thời gian đăng ký
    // --------------------------------------------------

    if (
        registrationStart &&
        registrationEnd &&
        registrationStart >= registrationEnd
    ) {
        throw createError(
            'Thời gian kết thúc đăng ký phải sau thời gian bắt đầu.'
        );
    }

    // --------------------------------------------------
    // 4.10. Kiểm tra thời gian diễn ra hoạt động
    // --------------------------------------------------

    if (
        activityStart &&
        activityEnd &&
        activityStart >= activityEnd
    ) {
        throw createError(
            'Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.'
        );
    }

    // --------------------------------------------------
    // 4.11. Kiểm tra thời gian đăng ký và hoạt động
    // --------------------------------------------------

    if (
        registrationEnd &&
        activityStart &&
        registrationEnd > activityStart
    ) {
        throw createError(
            'Thời gian đăng ký không được kết thúc sau khi hoạt động bắt đầu.'
        );
    }

    // --------------------------------------------------
    // 4.12. Kiểm tra hình thức đăng ký
    // --------------------------------------------------

    if (
        data.registrationMode !== undefined &&
        !['OPEN', 'APPROVAL'].includes(data.registrationMode)
    ) {
        throw createError('Hình thức đăng ký không hợp lệ.');
    }
}

// ======================================================
// 5. LẤY DANH SÁCH HOẠT ĐỘNG
// ======================================================

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

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw createError('Thông tin phân trang không hợp lệ.');
    }

    // Người chưa đăng nhập chỉ được xem hoạt động đã công bố.
    const effectiveStatus = currentUser
        ? status
        : 'PUBLISHED';

    return activityRepository.getActivities({
        keyword,
        status: effectiveStatus,
        organizationId,
        page,
        limit
    });
}

// ======================================================
// 6. LẤY CHI TIẾT HOẠT ĐỘNG
// ======================================================

async function getActivityById({
    activityId,
    currentUser
}) {
    const id = validateActivityId(activityId);

    const activity = await activityRepository.findById(id);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    // Người chưa đăng nhập không được xem hoạt động chưa công bố.
    if (
        !currentUser &&
        activity.status !== 'PUBLISHED'
    ) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    return activity;
}

// ======================================================
// 7. LẤY THÔNG TIN BẢN NHÁP ĐỂ CHỈNH SỬA
// ======================================================

async function getActivityForEdit({
    activityId,
    actorId
}) {
    const id = validateActivityId(activityId);

    if (!actorId) {
        throw createError('Không xác định được tài khoản đăng nhập.', 401);
    }

    // --------------------------------------------------
    // 7.1. Kiểm tra hoạt động tồn tại
    // --------------------------------------------------

    const activity = await activityRepository.findById(id);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    // --------------------------------------------------
    // 7.2. Chỉ cho phép lấy thông tin bản nháp
    // --------------------------------------------------

    if (activity.status !== 'DRAFT') {
        throw createError(
            'Chỉ được chỉnh sửa hoạt động ở trạng thái bản nháp.',
            409
        );
    }

    // --------------------------------------------------
    // 7.3. Kiểm tra thành viên đơn vị tổ chức
    // --------------------------------------------------

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        activity.organization_id
    );

    if (!isMember) {
        throw createError(
            'Bạn không có quyền chỉnh sửa hoạt động này.',
            403
        );
    }

    return activity;
}

// ======================================================
// 8. TẠO HOẠT ĐỘNG
// ======================================================

async function createActivity({
    data,
    actorId
}) {
    validateActivityData(data);

    if (!actorId) {
        throw createError('Không xác định được tài khoản đăng nhập.', 401);
    }

    // --------------------------------------------------
    // 8.1. Kiểm tra đơn vị tổ chức
    // --------------------------------------------------

    const organizationId = Number(data.organizationId);

    if (
        !Number.isSafeInteger(organizationId) ||
        organizationId <= 0
    ) {
        throw createError('Đơn vị tổ chức không hợp lệ.');
    }

    // --------------------------------------------------
    // 8.2. Kiểm tra thành viên đơn vị
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 8.3. Chuẩn hóa dữ liệu
    // --------------------------------------------------

    const expectedPoints = Number(data.expectedPoints ?? 0);

    // --------------------------------------------------
    // 8.4. Lưu hoạt động
    // --------------------------------------------------

    const activity = await activityRepository.createActivity({
        activityCode: generateActivityCode(),
        organizationId,
        activityName: data.activityName.trim(),
        description:
            typeof data.description === 'string'
                ? data.description.trim() || null
                : null,
        location: data.location.trim(),
        registrationStart: data.registrationStart,
        registrationEnd: data.registrationEnd,
        activityStart: data.activityStart,
        activityEnd: data.activityEnd,
        maxParticipants: data.maxParticipants ?? null,
        expectedPoints,
        registrationMode: data.registrationMode || 'OPEN',
        createdBy: actorId
    });

    return activity;
}

// ======================================================
// 9. CẬP NHẬT HOẠT ĐỘNG
// ======================================================

async function updateActivity({
    activityId,
    data,
    actorId
}) {
    const id = validateActivityId(activityId);

    if (!actorId) {
        throw createError('Không xác định được tài khoản đăng nhập.', 401);
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw createError('Dữ liệu cập nhật không hợp lệ.');
    }

    // --------------------------------------------------
    // 9.1. Kiểm tra hoạt động tồn tại
    // --------------------------------------------------

    const existing = await activityRepository.findById(id);

    if (!existing) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    // --------------------------------------------------
    // 9.2. Chỉ cho phép cập nhật bản nháp
    // --------------------------------------------------

    if (existing.status !== 'DRAFT') {
        throw createError(
            'Chỉ được chỉnh sửa hoạt động ở trạng thái bản nháp.',
            409
        );
    }

    // --------------------------------------------------
    // 9.3. Kiểm tra quyền thành viên đơn vị tổ chức
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 9.4. Kiểm tra trường nào được gửi lên
    // --------------------------------------------------

    const hasField = (field) =>
        Object.prototype.hasOwnProperty.call(data, field);

    // --------------------------------------------------
    // 9.5. Kết hợp dữ liệu mới với dữ liệu hiện tại
    // --------------------------------------------------

    const mergedData = {
        activityName: hasField('activityName')
            ? data.activityName
            : existing.activity_name,

        // Không cho phép thay đổi đơn vị sở hữu hoạt động.
        organizationId: existing.organization_id,

        location: hasField('location')
            ? data.location
            : existing.location,

        registrationStart: hasField('registrationStart')
            ? data.registrationStart
            : existing.registration_start,

        registrationEnd: hasField('registrationEnd')
            ? data.registrationEnd
            : existing.registration_end,

        activityStart: hasField('activityStart')
            ? data.activityStart
            : existing.activity_start,

        activityEnd: hasField('activityEnd')
            ? data.activityEnd
            : existing.activity_end,

        maxParticipants: hasField('maxParticipants')
            ? data.maxParticipants
            : existing.max_participants,

        expectedPoints: hasField('expectedPoints')
            ? data.expectedPoints
            : existing.expected_points,

        registrationMode: hasField('registrationMode')
            ? data.registrationMode
            : existing.registration_mode
    };

    // --------------------------------------------------
    // 9.6. Kiểm tra dữ liệu sau khi kết hợp
    // --------------------------------------------------

    validateActivityData(mergedData, true);

    // --------------------------------------------------
    // 9.7. Chuẩn hóa dữ liệu cập nhật
    // --------------------------------------------------

    const updateData = {
        activityName: mergedData.activityName.trim(),

        // Cho phép xóa nội dung mô tả bằng cách gửi null.
        description: hasField('description')
            ? (
                typeof data.description === 'string'
                    ? data.description.trim() || null
                    : data.description
            )
            : existing.description,

        location: mergedData.location.trim(),

        registrationStart: mergedData.registrationStart,
        registrationEnd: mergedData.registrationEnd,
        activityStart: mergedData.activityStart,
        activityEnd: mergedData.activityEnd,

        // Cho phép bỏ giới hạn số lượng khi gửi null.
        maxParticipants: mergedData.maxParticipants,

        expectedPoints: Number(mergedData.expectedPoints ?? 0),

        registrationMode: mergedData.registrationMode
    };

    // --------------------------------------------------
    // 9.8. Cập nhật database
    // --------------------------------------------------

    const updated = await activityRepository.updateActivity(
        id,
        updateData
    );

    if (!updated) {
        throw createError(
            'Không thể cập nhật hoạt động. Vui lòng tải lại dữ liệu.',
            409
        );
    }

    // --------------------------------------------------
    // 9.9. Trả về dữ liệu sau khi cập nhật
    // --------------------------------------------------

    return activityRepository.findById(id);
}

// ======================================================
// 10. CÔNG BỐ HOẠT ĐỘNG
// ======================================================

async function publishActivity({
    activityId,
    actorId
}) {
    const id = validateActivityId(activityId);

    if (!actorId) {
        throw createError('Không xác định được tài khoản đăng nhập.', 401);
    }

    // --------------------------------------------------
    // 10.1. Kiểm tra hoạt động tồn tại
    // --------------------------------------------------

    const existing = await activityRepository.findById(id);

    if (!existing) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    // --------------------------------------------------
    // 10.2. Chỉ cho phép công bố bản nháp
    // --------------------------------------------------

    if (existing.status !== 'DRAFT') {
        throw createError(
            'Chỉ được công bố hoạt động ở trạng thái bản nháp.',
            409
        );
    }

    // --------------------------------------------------
    // 10.3. Kiểm tra thành viên đơn vị tổ chức
    // --------------------------------------------------

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        existing.organization_id
    );

    if (!isMember) {
        throw createError(
            'Bạn không có quyền công bố hoạt động này.',
            403
        );
    }

    // --------------------------------------------------
    // 10.4. Kiểm tra dữ liệu trước khi công bố
    // --------------------------------------------------

    validateActivityData({
        activityName: existing.activity_name,
        organizationId: existing.organization_id,
        location: existing.location,
        registrationStart: existing.registration_start,
        registrationEnd: existing.registration_end,
        activityStart: existing.activity_start,
        activityEnd: existing.activity_end,
        maxParticipants: existing.max_participants,
        expectedPoints: existing.expected_points,
        registrationMode: existing.registration_mode
    }, true);

    // --------------------------------------------------
    // 10.5. Thực hiện công bố
    // --------------------------------------------------

    const published = await activityRepository.publishActivity(id);

    if (!published) {
        throw createError(
            'Không thể công bố hoạt động. Vui lòng tải lại dữ liệu.',
            409
        );
    }

    return activityRepository.findById(id);
}

// ======================================================
// 11. EXPORT
// ======================================================

module.exports = {
    getActivities,
    getActivityById,
    getActivityForEdit,
    createActivity,
    updateActivity,
    publishActivity
};
