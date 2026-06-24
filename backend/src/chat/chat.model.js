const sql = require("mssql");
const { connectDB } = require("../config/connect");

const resolveChatUserId = (value) => String(value || "").trim().toLowerCase();

const toBool = (value) => value === 1 || value === true;

const normalizeRoom = (row) => ({
	RoomID: row.RoomID,
	RoomType: row.RoomType,
	RoomKey: row.RoomKey,
	CreatedBy: row.CreatedBy,
	ParticipantName: row.ParticipantName || "",
	ParticipantAvatar: row.ParticipantAvatar || "",
	CreatedAt: row.CreatedAt,
	UpdatedAt: row.UpdatedAt,
	LastMessageAt: row.LastMessageAt,
	IsClosed: toBool(row.IsClosed),
	LastMessageText: row.LastMessageText || "",
	LastMessageType: row.LastMessageType || "text",
	LastSenderID: row.LastSenderID || null,
	MemberCount: Number(row.MemberCount || 0),
	UnreadCount: Number(row.UnreadCount || 0),
});

const roomParticipantJoinSql = `
	LEFT JOIN ACCOUNT A
		ON A.Email = CASE
			WHEN r.RoomKey LIKE 'support_user_%'
			THEN SUBSTRING(r.RoomKey, LEN('support_user_') + 1, 255)
			ELSE NULL
		END
`;

const normalizeMessage = (row) => ({
	MessageID: row.MessageID,
	RoomID: row.RoomID,
	SenderID: row.SenderID,
	MessageText: row.MessageText,
	MessageType: row.MessageType,
	CreatedAt: row.CreatedAt,
	IsSeen: toBool(row.IsSeen),
	SeenAt: row.SeenAt,
});

// Lấy thông tin phòng chat theo ID
exports.getRoomById = async (roomId) => {
	const pool = await connectDB();
	const result = await pool.request()
		.input("roomId", sql.Int, roomId)
		.query(`
			SELECT TOP 1
				r.*,
				A.DisplayName AS ParticipantName,
				A.Avatar AS ParticipantAvatar
			FROM CHAT_ROOM
				AS r
			${roomParticipantJoinSql}
			WHERE RoomID = @roomId
		`);

	return result.recordset?.[0] || null;
};

// Lấy phòng chat theo ID người dùng
exports.getRoomByKey = async (roomKey) => {
	const pool = await connectDB();
	const result = await pool.request()
		.input("roomKey", sql.NVarChar(255), roomKey)
		.query(`
			SELECT TOP 1
				r.*,
				A.DisplayName AS ParticipantName,
				A.Avatar AS ParticipantAvatar
			FROM CHAT_ROOM
				AS r
			${roomParticipantJoinSql}
			WHERE RoomKey = @roomKey
		`);

	return result.recordset?.[0] || null;
};

// Tạo phòng chat mới
exports.createRoom = async ({ roomType = "private", roomKey = null, createdBy = null }) => {
	const pool = await connectDB();
	const result = await pool.request()
		.input("roomType", sql.NVarChar(20), roomType)
		.input("roomKey", sql.NVarChar(255), roomKey)
		.input("createdBy", sql.NVarChar(255), createdBy ? resolveChatUserId(createdBy) : null)
		.query(`
			INSERT INTO CHAT_ROOM (RoomType, RoomKey, CreatedBy)
			OUTPUT INSERTED.*
			VALUES (@roomType, @roomKey, @createdBy)
		`);

	return result.recordset?.[0] || null;
};

exports.ensureRoomMember = async ({ roomId, userId }) => {
	const pool = await connectDB();
	await pool.request()
		.input("roomId", sql.Int, roomId)
		.input("userId", sql.NVarChar(255), resolveChatUserId(userId))
		.query(`
			IF NOT EXISTS (
				SELECT 1
				FROM CHAT_ROOM_MEMBER
				WHERE RoomID = @roomId AND CAST(UserID AS NVARCHAR(255)) = @userId
			)
			BEGIN
				INSERT INTO CHAT_ROOM_MEMBER (RoomID, UserID)
				VALUES (@roomId, @userId)
			END
		`);
};

// Kiểm tra quyền truy cập phòng chat
exports.getOrCreateSupportRoom = async ({ userId }) => {
	const roomKey = `support_user_${userId}`;
	let room = await exports.getRoomByKey(roomKey);
	let isNewRoom = false;
	// Nếu chưa có phòng chat, tạo mới
	if (!room) {
		room = await exports.createRoom({ roomType: "private", roomKey, createdBy: null });
		isNewRoom = true;
	}

	return {
		room,
		isNewRoom,
	};
};

exports.listRooms = async () => {
	const pool = await connectDB();
	const result = await pool.request().query(`
		SELECT
			r.*,
			A.DisplayName AS ParticipantName,
			A.Avatar AS ParticipantAvatar,
			ISNULL(memberCounts.MemberCount, 0) AS MemberCount,
			ISNULL(unreadCounts.UnreadCount, 0) AS UnreadCount,
			lastMsg.MessageText AS LastMessageText,
			lastMsg.MessageType AS LastMessageType,
			lastMsg.SenderID AS LastSenderID
		FROM CHAT_ROOM r
		${roomParticipantJoinSql}
		OUTER APPLY (
			SELECT TOP 1
				m.MessageText,
				m.MessageType,
				m.SenderID,
				m.CreatedAt
			FROM CHAT_MESSAGE m
			WHERE m.RoomID = r.RoomID
			ORDER BY m.CreatedAt DESC, m.MessageID DESC
		) lastMsg
		OUTER APPLY (
			SELECT COUNT(1) AS MemberCount
			FROM CHAT_ROOM_MEMBER m
			WHERE m.RoomID = r.RoomID
		) memberCounts
		OUTER APPLY (
			SELECT COUNT(1) AS UnreadCount
			FROM CHAT_MESSAGE m
			LEFT JOIN ACCOUNT senderAccount
				ON senderAccount.Email = CAST(m.SenderID AS NVARCHAR(255))
			WHERE m.RoomID = r.RoomID AND m.IsSeen = 0
				AND LOWER(CAST(m.SenderID AS NVARCHAR(255))) <> 'admin'
				AND ISNULL(senderAccount.Role, 0) <> 1
		) unreadCounts
		ORDER BY COALESCE(r.LastMessageAt, r.CreatedAt) DESC, r.RoomID DESC
	`);

		return (result.recordset || []).map(normalizeRoom);
};

// Lấy tin nhắn của phòng chat với hỗ trợ tải trước (before) để phân trang ngược
exports.listMessages = async ({ roomId, limit = 15, before = null }) => {
	const pool = await connectDB();

	const req = pool.request().input("roomId", sql.Int, roomId).input("limit", sql.Int, limit);

	let query;
	if (before) {
		req.input("before", sql.DateTime2, new Date(before));
		// Lấy các tin nhắn trước thời điểm `before`, sắp xếp giảm dần rồi đảo lại để trả về theo thứ tự tăng dần
		query = `
			SELECT TOP (@limit)
				MessageID,
				RoomID,
				SenderID,
				MessageText,
				MessageType,
				CreatedAt,
				IsSeen,
				SeenAt
			FROM CHAT_MESSAGE
			WHERE RoomID = @roomId AND CreatedAt < @before
			ORDER BY CreatedAt DESC, MessageID DESC
		`;
		const result = await req.query(query);
		const rows = (result.recordset || []).map(normalizeMessage);
		return rows.reverse();
	} else {
			// When `before` is not provided, return the most recent `limit` messages.
			// Select in descending order then reverse to return ascending by CreatedAt to the client.
			query = `
				SELECT TOP (@limit)
					MessageID,
					RoomID,
					SenderID,
					MessageText,
					MessageType,
					CreatedAt,
					IsSeen,
					SeenAt
				FROM CHAT_MESSAGE
				WHERE RoomID = @roomId
				ORDER BY CreatedAt DESC, MessageID DESC
			`;
			const result = await req.query(query);
			const rows = (result.recordset || []).map(normalizeMessage);
			return rows.reverse();
	}
};

// Tạo tin nhán vào room và đánh dấu đã xem cho tin nhắn cũ
exports.createMessage = async ({ roomId, senderId, messageText, messageType = "text" }) => {
	const pool = await connectDB();
	const result = await pool.request()
		.input("roomId", sql.Int, roomId)
		.input("senderId", sql.NVarChar(255), resolveChatUserId(senderId))
		.input("messageText", sql.NVarChar(sql.MAX), messageText)
		.input("messageType", sql.NVarChar(20), messageType)
		.query(`
			INSERT INTO CHAT_MESSAGE (RoomID, SenderID, MessageText, MessageType)
			OUTPUT INSERTED.MessageID, INSERTED.RoomID, INSERTED.SenderID, INSERTED.MessageText, INSERTED.MessageType, INSERTED.CreatedAt, INSERTED.IsSeen, INSERTED.SeenAt
			VALUES (@roomId, @senderId, @messageText, @messageType)

			UPDATE CHAT_ROOM
			SET UpdatedAt = SYSDATETIME(), LastMessageAt = SYSDATETIME()
			WHERE RoomID = @roomId;
		`);

	const message = result.recordset?.[0] || null;
	return message ? normalizeMessage(message) : null;
};

exports.markRoomAsSeen = async ({ roomId, viewerId, viewerRole = 0 }) => {
	const pool = await connectDB();
	const isAdminViewer = Number(viewerRole || 0) === 1;
	const seenSql = isAdminViewer
		? `
			UPDATE m
			SET m.IsSeen = 1,
				m.SeenAt = SYSDATETIME()
			FROM CHAT_MESSAGE m
			LEFT JOIN ACCOUNT a
				ON a.Email = CAST(m.SenderID AS NVARCHAR(255))
			WHERE m.RoomID = @roomId
				AND LOWER(CAST(m.SenderID AS NVARCHAR(255))) <> 'admin'
				AND ISNULL(a.Role, 0) <> 1
		`
		: `
			UPDATE m
			SET m.IsSeen = 1,
				m.SeenAt = SYSDATETIME()
		FROM CHAT_MESSAGE m
		LEFT JOIN ACCOUNT a
			ON a.Email = CAST(m.SenderID AS NVARCHAR(255))
		WHERE m.RoomID = @roomId
			AND (
				LOWER(CAST(m.SenderID AS NVARCHAR(255))) = 'admin'
				OR ISNULL(a.Role, 0) = 1
			)
		`;
	await pool.request()
		.input("roomId", sql.Int, roomId)
		.input("viewerId", sql.NVarChar(255), resolveChatUserId(viewerId))
		.query(seenSql);
};

exports.isUserInRoom = async ({ roomId, userId }) => {
	const pool = await connectDB();
	const result = await pool.request()
		.input("roomId", sql.Int, roomId)
		.input("userId", sql.NVarChar(255), resolveChatUserId(userId))
		.query(`
			SELECT TOP 1 1 AS IsMember
			FROM CHAT_ROOM_MEMBER
			WHERE RoomID = @roomId AND CAST(UserID AS NVARCHAR(255)) = @userId
		`);

	return result.recordset?.length > 0;
};

exports.normalizeRoom = normalizeRoom;
