import { SAMPLE_BEANS, SAMPLE_BREWS, SAMPLE_GRINDERS } from '$lib/data/sample';
import type { Bean, Brew, Grinder } from '$lib/data/types';

let beans = $state<Bean[]>(SAMPLE_BEANS);
let brews = $state<Brew[]>(SAMPLE_BREWS);
let grinders = $state<Grinder[]>(SAMPLE_GRINDERS);

function addBrew(brew: Brew) {
	brews = [brew, ...brews];
}

export const journal = {
	get beans() {
		return beans;
	},
	get brews() {
		return brews;
	},
	get grinders() {
		return grinders;
	},
	addBrew
};
