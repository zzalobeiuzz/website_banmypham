const {
	getRoomById,
	getRoomByKey,
	getOrCreateSupportRoom,
	listMessages,
	normalizeRoom,
	createMessage,
	markRoomAsSeen,
	listRooms,
} = require("./chat.model");

// Xử lý sự kiện gửi tin nhắn
const resolveRoomAccess = async ({ roomId, user }) => {
	// Lấy phòng chat
	const room = await getRoomById(roomId);
	if (!room) {
		throw new Error("Phòng chat không tồn tại.");
	}

	if (Number(user?.role || 0) === 1) {
		return room;
	}

	const isOwnerRoom = String(room.RoomKey || "") === `support_user_${user?.id}`;

	if (!isOwnerRoom) {
		throw new Error("Bạn không có quyền truy cập phòng chat này.");
	}

	return room;
};

exports.getOrCreateSupportRoom = async ({ userId }) => {
	if (!userId) {
		throw new Error("Thiếu thông tin người dùng.");
	}

	return getOrCreateSupportRoom({ userId });
};

// Lấy chi tiết phòng chat và tin nhắn
exports.getRoomDetail = async ({ roomId, user }) => {
	// Lấy phòng chat
	const room = await resolveRoomAccess({ roomId, user });
	// Lấy tin nhán của phòng chat
	const messages = await listMessages({ roomId, limit: 100 });

	return {
		room: normalizeRoom(room),
		messages,
	};
};

// Lấy phòng chat theo ID người dùng 
exports.getSupportRoomForUser = async ({ user }) => {
	const { room, isNewRoom } = await getOrCreateSupportRoom({ userId: user.id });

	// Nếu là phòng chat mới, tạo tin nhắn chào mừng
	if (isNewRoom) {
		await createMessage({
			roomId: room.RoomID,
			senderId: "admin",
			messageText: "Xin chào, mình có thể hỗ trợ gì cho bạn?",
			messageType: "text",
		});
	}

	// Lấy tin nhắn của phòng chat
	const messages = await listMessages({ roomId: room.RoomID, limit: 100 });
	return {
		room: normalizeRoom(room),
		messages,
		isNewRoom,
	};
};

exports.listRoomsForAdmin = async () => {
	const rooms = await listRooms();
	return rooms;
};

exports.sendMessage = async ({ roomId, user, messageText, messageType = "text" }) => {
	if (!roomId) {
		throw new Error("Thiếu mã phòng chat.");
	}

	const text = String(messageText || "").trim();
	if (!text) {
		throw new Error("Nội dung tin nhắn không được trống.");
	}

	await resolveRoomAccess({ roomId, user });

	const message = await createMessage({
		roomId,
		senderId: user.id,
		messageText: text,
		messageType,
	});

	return message;
};

exports.markSeen = async ({ roomId, user }) => {
	await resolveRoomAccess({ roomId, user });
	await markRoomAsSeen({ roomId, viewerId: user.id, viewerRole: user?.role });
};

exports.getRoomById = getRoomById;
exports.getRoomByKey = getRoomByKey;