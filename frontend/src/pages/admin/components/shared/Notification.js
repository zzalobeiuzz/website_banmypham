import PopupNotification from "./PopupNotification";

const Notification = ({
	message,
	type = "success",
	status,
	open = true,
	onClose,
	onConfirm,
	question,
	confirmText,
	closeText,
}) => (
	<PopupNotification
		open={open}
		status={status || type}
		message={message}
		onClose={onClose}
		onConfirm={onConfirm}
		question={question}
		confirmText={confirmText}
		closeText={closeText}
	/>
);

export default Notification;