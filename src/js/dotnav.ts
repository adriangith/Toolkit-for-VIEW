/**
 * dots.ts v1.0.0 (TypeScript Conversion)
 * Based on dots.js v1.0.0 from http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2014, Codrops
 * http://www.codrops.com
 */

/**
 * Interface for DotNav options.
 */
export interface DotNavOptions {
	/**
	 * Callback function triggered when a dot is clicked and the current index changes.
	 * @param {number} currentIndex - The index of the newly selected dot.
	 * @returns {void}
	 */
	callback?: (currentIndex: number) => void;
}

/**
 * Creates an interactive dot navigation.
 */
export class DotNav {
	/** The navigation HTML element (e.g., <ul> or <ol>). */
	private nav: HTMLElement;
	/** Configuration options for the DotNav instance. */
	private options: DotNavOptions;
	/** Array of list item elements (<li>) representing the dots. */
	private dots!: HTMLLIElement[];
	/** The index of the currently active dot. */
	private currentDotIndex: number = 0;
	/** Flag indicating if the special 'hop' animation style is active. */
	private isHopStyle: boolean = false;

	/**
	 * Initializes a new DotNav instance.
	 * @param {HTMLElement} el - The container element for the dot navigation (usually a <ul> or <ol>).
	 * @param {Partial<DotNavOptions>} [options] - Optional configuration settings.
	 */
	constructor(el: HTMLElement, options?: Partial<DotNavOptions>) {
		this.nav = el;
		// Set default options and merge with provided options
		this.options = {
			callback: undefined, // Default: no callback
			...options,         // User-provided options override defaults
		};
		this._init();
	}

	/**
	 * Initializes the dot navigation, finds dots, and sets up event listeners.
	 * @private
	 */
	private _init(): void {
		// Check for the special "dotstyle-hop" class on the parent element
		this.isHopStyle =
			this.nav.parentNode instanceof HTMLElement && // Ensure parentNode is an element
			this.nav.parentNode.classList.contains('dotstyle-hop');

		// Get all list items within the navigation element
		this.dots = Array.from(this.nav.querySelectorAll('li'));

		if (this.dots.length === 0) {
			console.warn('DotNav: No list items (dots) found inside the provided element.', this.nav);
			return;
		}

		// Set the initial current class
		if (this.dots[this.currentDotIndex]) {
			this.dots[this.currentDotIndex].classList.add('current');
		}

		// Add click listeners to each dot
		this.dots.forEach((dot, index) => {
			dot.addEventListener('click', (event: MouseEvent) => {
				event.preventDefault();
				this.handleDotClick(index);
			});
		});
	}

	/**
	 * Handles the click event on a dot.
	 * @param {number} index - The index of the clicked dot.
	 * @private
	 */
	private handleDotClick(index: number): void {
		if (index === this.currentDotIndex || !this.dots[index]) {
			// Do nothing if the clicked dot is already current or doesn't exist
			return;
		}

		// Remove 'current' class from the previously active dot
		if (this.dots[this.currentDotIndex]) {
			this.dots[this.currentDotIndex].className = ''; // Using className to clear all potentially added classes
		}

		const clickedDot = this.dots[index];

		// Special case for "dotstyle-hop" animation when moving left
		if (this.isHopStyle && index < this.currentDotIndex) {
			clickedDot.classList.add('current-from-right');
		}

		// Add 'current' class after a short delay for transitions/animations
		// Using 25ms delay as in the original script
		setTimeout(() => {
			// Ensure previous 'current-from-right' is removed if it exists before adding 'current'
			clickedDot.classList.remove('current-from-right');
			clickedDot.classList.add('current');

			this.currentDotIndex = index;

			// Execute the callback function if provided
			if (typeof this.options.callback === 'function') {
				this.options.callback(this.currentDotIndex);
			}
		}, 25);
	}

	/**
	 * Programmatically sets the current dot.
	 * @param {number} index - The index of the dot to set as current.
	 * @param {boolean} [triggerCallback=false] - Whether to trigger the callback function.
	 */
	public setCurrent(index: number, triggerCallback: boolean = false): void {
		if (index >= 0 && index < this.dots.length && index !== this.currentDotIndex) {
			// Simulate a click without the event object or delay, directly updating state
			if (this.dots[this.currentDotIndex]) {
				this.dots[this.currentDotIndex].className = '';
			}
			const newDot = this.dots[index];
			newDot.className = 'current'; // Directly set current class
			this.currentDotIndex = index;

			if (triggerCallback && typeof this.options.callback === 'function') {
				this.options.callback(this.currentDotIndex);
			}
		}
	}

	/**
	 * Gets the index of the currently active dot.
	 * @returns {number} The current index.
	 */
	public getCurrentIndex(): number {
		return this.currentDotIndex;
	}
}

// Example Usage (assuming you have an HTML structure like below):
/*
<nav id="dot-nav" class="dotstyle dotstyle-fillup">
  <ul>
	<li><a href="#">Dot 1</a></li>
	<li><a href="#">Dot 2</a></li>
	<li><a href="#">Dot 3</a></li>
  </ul>
</nav>

// In your main TypeScript file:
import { DotNav } from './dots'; // Adjust the path as needed

const navElement = document.getElementById('dot-nav');
if (navElement) {
  const dotNavInstance = new DotNav(navElement, {
	callback: (index) => {
	  console.log(`Mapsd to dot index: ${index}`);
	  // Add logic here to update content based on the index
	}
  });

  // You could also programmatically set the current dot:
  // setTimeout(() => dotNavInstance.setCurrent(1), 2000);
}
*/