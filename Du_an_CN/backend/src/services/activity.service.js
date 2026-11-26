
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
// 2. TẠO MÃ HOẠT ĐỘNG
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
// 3. KIỂM TRA DỮ LIỆU HOẠT ĐỘNG
// ======================================================

function validateActivityData(data, isUpdate = false) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
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
    // 3.1. Kiểm tra các trường bắt buộc khi tạo mới
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
    // 3.2. Kiểm tra số lượng người tham gia tối đa
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
    // 3.3. Kiểm tra điểm cộng khi hoàn thành hoạt động
    // --------------------------------------------------

    if (
        data.expectedPoints !== undefined &&
        data.expectedPoints !== null
    ) {
        if (
            String(data.expectedPoints).trim() === ''
        ) {
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
    // 3.4. Kiểm tra định dạng ngày giờ
    // --------------------------------------------------

    const dates = [
        data.registrationStart,
        data.registrationEnd,
        data.activityStart,
        data.activityEnd
    ];

    const suppliedDates = dates.filter(
        value => value !== undefined && value !== null
    );

    for (const value of suppliedDates) {
        if (Number.isNaN(Date.parse(value))) {
            throw createError(
                'Ngày hoặc giờ hoạt động không hợp lệ.'
            );
        }
    }

    // --------------------------------------------------
    // 3.5. Kiểm tra thời gian đăng ký
    // --------------------------------------------------

    if (
        data.registrationStart &&
        data.registrationEnd &&
        new Date(data.registrationStart) >=
        new Date(data.registrationEnd)
    ) {
        throw createError(
            'Thời gian kết thúc đăng ký phải sau thời gian bắt đầu.'
        );
    }

    // --------------------------------------------------
    // 3.6. Kiểm tra thời gian diễn ra hoạt động
    // --------------------------------------------------

    if (
        data.activityStart &&
        data.activityEnd &&
        new Date(data.activityStart) >=
        new Date(data.activityEnd)
    ) {
        throw createError(
            'Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.'
        );
    }

    // --------------------------------------------------
    // 3.7. Kiểm tra thời gian đăng ký và thời gian hoạt động
    // --------------------------------------------------

    if (
        data.registrationEnd &&
        data.activityStart &&
        new Date(data.registrationEnd) >
        new Date(data.activityStart)
    ) {
        throw createError(
            'Thời gian đăng ký không được kết thúc sau khi hoạt động bắt đầu.'
        );
    }

    // --------------------------------------------------
    // 3.8. Kiểm tra hình thức đăng ký
    // --------------------------------------------------

    if (
        data.registrationMode &&
        !['OPEN', 'APPROVAL'].includes(data.registrationMode)
    ) {
        throw createError(
            'Hình thức đăng ký không hợp lệ.'
        );
    }
}

// ======================================================
// 4. LẤY DANH SÁCH HOẠT ĐỘNG
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
        throw createError(
            'Thông tin phân trang không hợp lệ.'
        );
    }

    // Người chưa đăng nhập chỉ được xem hoạt động đã công bố.
    const effectiveStatus = currentUser
        ? status
        : (status || 'PUBLISHED');

    return activityRepository.getActivities({
        keyword,
        status: effectiveStatus,
        organizationId,
        page,
        limit
    });
}

// ======================================================
// 5. LẤY CHI TIẾT HOẠT ĐỘNG
// ======================================================

async function getActivityById({
    activityId,
    currentUser
}) {
    const activity = await activityRepository.findById(
        activityId
    );

    if (!activity) {
        throw createError(
            'Không tìm thấy hoạt động.',
            404
        );
    }

    // Người chưa đăng nhập không được xem hoạt động chưa công bố.
    if (
        !currentUser &&
        activity.status !== 'PUBLISHED'
    ) {
        throw createError(
            'Không tìm thấy hoạt động.',
            404
        );
    }

    return activity;
}

// ======================================================
// 6. TẠO HOẠT ĐỘNG
// ======================================================

async function createActivity({
    data,
    actorId
}) {
    validateActivityData(data);

    // --------------------------------------------------
    // 6.1. Kiểm tra đơn vị tổ chức
    // --------------------------------------------------

    const organizationId = Number(data.organizationId);

    if (
        !Number.isSafeInteger(organizationId) ||
        organizationId <= 0
    ) {
        throw createError(
            'Đơn vị tổ chức không hợp lệ.'
        );
    }

    // --------------------------------------------------
    // 6.2. Kiểm tra quyền thành viên đơn vị
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
    // 6.3. Chuẩn hóa điểm hoạt động
    // --------------------------------------------------

    const expectedPoints = Number(
        data.expectedPoints ?? 0
    );

    // --------------------------------------------------
    // 6.4. Lưu hoạt động vào database
    // --------------------------------------------------

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

        // Điểm được đơn vị tổ chức thiết lập
        // và chỉ cộng sau khi sinh viên hoàn thành hoạt động.
        expectedPoints,

        registrationMode: data.registrationMode || 'OPEN',

        createdBy: actorId
    });

    return activity;
}

// ======================================================
// 7. CẬP NHẬT HOẠT ĐỘNG
// ======================================================

async function updateActivity({
    activityId,
    data,
    actorId
}) {
    // --------------------------------------------------
    // 7.1. Kiểm tra hoạt động tồn tại
    // --------------------------------------------------

    const existing = await activityRepository.findById(
        activityId
    );

    if (!existing) {
        throw createError(
            'Không tìm thấy hoạt động.',
            404
        );
    }

    // --------------------------------------------------
    // 7.2. Chỉ cho phép chỉnh sửa bản nháp
    // --------------------------------------------------

    if (existing.status !== 'DRAFT') {
        throw createError(
            'Chỉ được chỉnh sửa hoạt động ở trạng thái bản nháp.',
            409
        );
    }

    // --------------------------------------------------
    // 7.3. Kiểm tra quyền của đơn vị tổ chức
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
    // 7.4. Kết hợp dữ liệu mới với dữ liệu hiện tại
    // --------------------------------------------------

    const mergedData = {
        activityName:
            data.activityName ?? existing.activity_name,

        organizationId:
            existing.organization_id,

        location:
            data.location ?? existing.location,

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

        expectedPoints:
            data.expectedPoints ?? existing.expected_points,

        registrationMode:
            data.registrationMode ?? existing.registration_mode
    };

    // Kiểm tra dữ liệu sau khi kết hợp.
    validateActivityData(mergedData, true);

    // --------------------------------------------------
    // 7.5. Chuẩn hóa dữ liệu điểm
    // --------------------------------------------------

    const expectedPoints =
        data.expectedPoints === undefined ||
        data.expectedPoints === null
            ? undefined
            : Number(data.expectedPoints);

    // --------------------------------------------------
    // 7.6. Cập nhật database
    // --------------------------------------------------

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

            // Không gửi trường này nếu người dùng không cập nhật điểm.
            // Repository sẽ giữ nguyên giá trị hiện tại.
            expectedPoints,

            registrationMode: data.registrationMode
        }
    );

    if (!updated) {
        throw createError(
            'Không thể cập nhật hoạt động. Vui lòng tải lại dữ liệu.',
            409
        );
    }

    // Trả về dữ liệu mới nhất sau khi cập nhật.
    return activityRepository.findById(activityId);
}

// ======================================================
// 8. CÔNG BỐ HOẠT ĐỘNG
// ======================================================

async function publishActivity({
    activityId,
    actorId
}) {
    // --------------------------------------------------
    // 8.1. Kiểm tra hoạt động tồn tại
    // --------------------------------------------------

    const existing = await activityRepository.findById(
        activityId
    );

    if (!existing) {
        throw createError(
            'Không tìm thấy hoạt động.',
            404
        );
    }

    // --------------------------------------------------
    // 8.2. Chỉ cho phép công bố bản nháp
    // --------------------------------------------------

    if (existing.status !== 'DRAFT') {
        throw createError(
            'Chỉ được công bố hoạt động ở trạng thái bản nháp.',
            409
        );
    }

    // --------------------------------------------------
    // 8.3. Kiểm tra quyền đơn vị tổ chức
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
    // 8.4. Thực hiện công bố
    // --------------------------------------------------

    const published = await activityRepository.publishActivity(
        activityId
    );

    if (!published) {
        throw createError(
            'Không thể công bố hoạt động. Vui lòng tải lại dữ liệu.',
            409
        );
    }

    return activityRepository.findById(activityId);
}

// ======================================================
// 9. EXPORT
// ======================================================

module.exports = {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    publishActivity
};
