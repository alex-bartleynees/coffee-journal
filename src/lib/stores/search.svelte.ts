let isOpen = $state(false);

function open(): void {
	isOpen = true;
}

function close(): void {
	isOpen = false;
}

export const search = {
	get isOpen() {
		return isOpen;
	},
	open,
	close
};
