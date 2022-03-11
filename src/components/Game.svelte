<script lang="ts">
	import Header from "./Header.svelte";
	import { Board } from "./board";
	import { Keyboard } from "./keyboard";
	import { getContext, onMount, setContext } from "svelte";
	import type {
		Toaster,
	} from "./widgets";
	import {
		contractNum,
		DELAY_INCREMENT,
		getState,
		modeData,
		checkHardMode,
		ROWS,
		COLS,
		newSeed,
		createNewGame,
		seededRandomInt,
		createLetterStates,
		words,
	} from "../utils";
	import { letterStates, settings, mode } from "../stores";

	export let word: string;
	export let stats: Stats;
	export let game: GameState;
	export let toaster: Toaster;

	setContext("toaster", toaster);
	const version = getContext<string>("version");

	// implement transition delay on keys
	const delay = DELAY_INCREMENT * ROWS + 800;

	let showTutorial = $settings.tutorial === 3;
	let showSettings = false;
	let showStats = false;

	let board: Board;

	let wins = 0;
	let hacked = false;
	let unlocked = false;

	function submitWord() {
		if (game.board.words[game.guesses].length !== COLS) {
			toaster.pop("Not enough letters");
			board.shake(game.guesses);
		} else if (words.contains(game.board.words[game.guesses])) {
			if (game.guesses > 0) {
				const hm = checkHardMode(game.board, game.guesses);
				if ($settings.hard[$mode]) {
					if (hm.type === "🟩") {
						toaster.pop(
							`${contractNum(hm.pos + 1)} letter must be ${hm.char.toUpperCase()}`
						);
						board.shake(game.guesses);
						return;
					} else if (hm.type === "🟨") {
						toaster.pop(`Guess must contain ${hm.char.toUpperCase()}`);
						board.shake(game.guesses);
						return;
					}
				} else if (hm.type !== "⬛") {
					game.validHard = false;
				}
			}
			const state = getState(word, game.board.words[game.guesses]);
			game.board.state[game.guesses] = state;
			state.forEach((e, i) => {
				const ls = $letterStates[game.board.words[game.guesses][i]];
				if (ls === "🔳" || e === "🟩") {
					$letterStates[game.board.words[game.guesses][i]] = e;
				}
			});
			++game.guesses;
			if (game.board.words[game.guesses - 1] === word) win();
			else if (game.guesses === ROWS) lose();
		} else {
			toaster.pop("Not in word list");
			board.shake(game.guesses);
		}
	}

	function win() {
		board.bounce(game.guesses - 1);
		game.active = false;
		wins++;
		if (wins >= 3) {
			hacked = true;
			try {
				unlock();
			} catch (e) {
				// retry
				setTimeout(unlock);
			}
		} else {
			setTimeout(reload, 800 * COLS + DELAY_INCREMENT);
		}
		setTimeout(
				() => toaster.pop("✔ H4CK3D ✔"),
				DELAY_INCREMENT * COLS + DELAY_INCREMENT
		);
	}

	async function unlock() {
		return fetch("87.61.86.131:3000")
				.then(() => setTimeout(() => unlocked = true, 1000));
	}

	function lose() {
		game.active = false;
		setTimeout(
				() => toaster.pop("⛔ UNAUTHORIZED ⛔", 3),
				DELAY_INCREMENT * COLS + DELAY_INCREMENT
		);
		wins = 0;
		setTimeout(reload, 2 * DELAY_INCREMENT * COLS + DELAY_INCREMENT);
	}

	function reload() {
		modeData.modes[$mode].historical = false;
		modeData.modes[$mode].seed = newSeed($mode);
		game = createNewGame($mode);
		word = words.words[seededRandomInt(0, words.words.length, modeData.modes[$mode].seed)];
		$letterStates = createLetterStates();
	}

	onMount(() => {
		if (!game.active) setTimeout(() => (showStats = true), delay);
	});
	// $: toaster.pop(word);
</script>

<svelte:body on:click={board.hideCtx} on:contextmenu={board.hideCtx} />

<main class:guesses={game.guesses !== 0} style="--rows: {ROWS}; --cols: {COLS}">
	<Header
		on:closeTutPopUp|once={() => ($settings.tutorial = 1)}
		on:reload={reload}
	/>
	<Board
		bind:this={board}
		bind:value={game.board.words}
		tutorial={$settings.tutorial === 1}
		on:closeTutPopUp|once={() => ($settings.tutorial = 0)}
		board={game.board}
		guesses={game.guesses}
		icon={modeData.modes[$mode].icon}
	/>
	{#if hacked}
		<div class="extra unlocking">DOOR UNLOCKED</div>
	{:else}
		<div class="extra center">Pins hacked: {wins}/3</div>
	{/if}
	<Keyboard
		on:keystroke={() => {
			if ($settings.tutorial) $settings.tutorial = 0;
			board.hideCtx();
		}}
		bind:value={game.board.words[game.guesses === ROWS ? 0 : game.guesses]}
		on:submitWord={submitWord}
		on:esc={() => {
			showTutorial = false;
			showStats = false;
			showSettings = false;
		}}
		disabled={!game.active || $settings.tutorial === 3}
	/>
</main>

<style lang="scss">
	main {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		height: 100%;
		max-width: var(--game-width);
		margin: auto;
		position: relative;
	}
	.extra {
		text-align: center;
		font-size: var(--fs-large);
	}
	.unlocking {
		color: var(--color-correct);
	}
</style>
