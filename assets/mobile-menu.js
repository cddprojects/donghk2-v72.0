(function () {
	var TOGGLE_SELECTOR = '.elementor-menu-toggle';
	var CONTAINER_CLASS = 'elementor-nav-menu__container';

	function normalizePath(path) {
		if (!path || path === '/') {
			return '/';
		}

		return path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
	}

	function syncNavActiveState() {
		var currentPath = normalizePath(window.location.pathname);
		var isHome = currentPath === '/';

		document.querySelectorAll('.elementor-nav-menu a.elementor-item[href]').forEach(function (link) {
			var listItem = link.closest('li');
			var linkPath = normalizePath(link.pathname);
			var isHomeLink = linkPath === '/' && !link.hash;
			var shouldBeActive = isHome && isHomeLink;

			link.classList.toggle('elementor-item-active', shouldBeActive);

			if (shouldBeActive) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}

			if (listItem) {
				listItem.classList.toggle('current-menu-item', shouldBeActive);
				listItem.classList.toggle('current_page_item', shouldBeActive);
			}
		});
	}

	// Expose the sticky header height as a CSS variable so the fixed mobile
	// navigation panel can be anchored directly beneath the header regardless of
	// the active responsive breakpoint.
	function updateHeaderHeight() {
		var header = document.querySelector('.elementor-location-header');
		if (!header) {
			return;
		}

		var height = Math.round(header.getBoundingClientRect().height);
		if (height > 0) {
			document.documentElement.style.setProperty('--ajobs-header-height', height + 'px');
		}
	}

	function getDropdown(toggle) {
		var dropdown = toggle.nextElementSibling;
		if (dropdown && dropdown.classList.contains(CONTAINER_CLASS)) {
			return dropdown;
		}
		return null;
	}

	function setMenuState(toggle, isOpen) {
		toggle.classList.toggle('elementor-active', isOpen);
		toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

		var dropdown = getDropdown(toggle);
		if (dropdown) {
			dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
			dropdown.querySelectorAll('a.elementor-item').forEach(function (link) {
				link.setAttribute('tabindex', isOpen ? '0' : '-1');
			});
		}
	}

	function toggleMenu(toggle) {
		updateHeaderHeight();
		setMenuState(toggle, !toggle.classList.contains('elementor-active'));
	}

	function closeMenu(toggle) {
		if (toggle) {
			setMenuState(toggle, false);
		}
	}

	function getToggleFromEvent(event) {
		var target = event.target;
		if (!target || typeof target.closest !== 'function') {
			return null;
		}
		return target.closest(TOGGLE_SELECTOR);
	}

	function isActivationKey(event) {
		return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.keyCode === 13 || event.keyCode === 32;
	}

	// Elementor's own nav-menu handler also binds a click/keyup listener on the
	// same toggle and toggles the exact same `elementor-active` class. When both
	// run on a single interaction the class is flipped twice and the menu never
	// opens. We capture the events on `document` (capturing phase runs before the
	// event reaches the toggle) and stop propagation so this script is the single
	// source of truth for the mobile menu, regardless of script load order.
	function initMobileMenu() {
		document.addEventListener(
			'click',
			function (event) {
				var toggle = getToggleFromEvent(event);
				if (!toggle) {
					return;
				}

				event.stopImmediatePropagation();
				toggleMenu(toggle);
			},
			true
		);

		document.addEventListener(
			'keydown',
			function (event) {
				var toggle = getToggleFromEvent(event);
				if (!toggle || !isActivationKey(event)) {
					return;
				}

				event.preventDefault();
				event.stopImmediatePropagation();
				toggleMenu(toggle);
			},
			true
		);

		// Block Elementor's keyup handler (which synthesizes a click) so a single
		// key press cannot toggle the menu twice.
		document.addEventListener(
			'keyup',
			function (event) {
				var toggle = getToggleFromEvent(event);
				if (!toggle || !isActivationKey(event)) {
					return;
				}

				event.stopImmediatePropagation();
			},
			true
		);

		// Close the open menu after a navigation link inside the dropdown is used.
		document.addEventListener('click', function (event) {
			var target = event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}

			var link = target.closest('.elementor-nav-menu--dropdown .elementor-item');
			if (!link) {
				return;
			}

			var widget = link.closest('.elementor-widget-nav-menu');
			if (widget) {
				closeMenu(widget.querySelector(TOGGLE_SELECTOR));
			}
		});

		// Ensure the initial state is consistent on load.
		document.querySelectorAll(TOGGLE_SELECTOR).forEach(function (toggle) {
			setMenuState(toggle, toggle.classList.contains('elementor-active'));
		});

		updateHeaderHeight();
		window.addEventListener('resize', updateHeaderHeight);
		window.addEventListener('orientationchange', updateHeaderHeight);
		window.addEventListener('load', updateHeaderHeight);
	}

	function init() {
		syncNavActiveState();
		initMobileMenu();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
