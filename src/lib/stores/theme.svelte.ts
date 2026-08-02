const STORAGE_KEY = 'bloom-theme';

type Theme = 'light' | 'dark';

function readInitial(): Theme | null {
	if (typeof localStorage === 'undefined') return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : null;
}

let theme = $state<Theme | null>(readInitial());

function apply(next: Theme | null) {
	theme = next;
	if (typeof document === 'undefined') return;
	if (next) {
		document.documentElement.setAttribute('data-theme', next);
		localStorage.setItem(STORAGE_KEY, next);
	} else {
		document.documentElement.removeAttribute('data-theme');
		localStorage.removeItem(STORAGE_KEY);
	}
}

function toggle() {
	const prefersDark =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
	const current = theme ?? (prefersDark ? 'dark' : 'light');
	apply(current === 'dark' ? 'light' : 'dark');
}

if (typeof document !== 'undefined' && theme) {
	document.documentElement.setAttribute('data-theme', theme);
}

export const themeStore = {
	get value() {
		return theme;
	},
	toggle
};
