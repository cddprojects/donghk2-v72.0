(function () {
	var checkIcon =
		'<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>';

	function initJobBoard() {
		var board = document.querySelector('.job-board');
		if (!board) {
			return;
		}

		var filters = board.querySelectorAll('.job-board__filter');
		var cards = board.querySelectorAll('[data-job-categories]');
		var track = board.querySelector('.job-board__featured-track');
		var featuredCards = board.querySelectorAll('.job-featured');
		var prevBtn = board.querySelector('.job-board__nav-btn--prev');
		var nextBtn = board.querySelector('.job-board__nav-btn--next');
		var dots = board.querySelectorAll('.job-board__dot');
		var activeFilter = 'all';
		var activeIndex = 0;

		function applyFilter(filter) {
			activeFilter = filter;

			filters.forEach(function (button) {
				button.classList.toggle('is-active', button.dataset.filter === filter);
			});

			cards.forEach(function (card) {
				var categories = (card.dataset.jobCategories || '').split(/\s+/);
				var visible = filter === 'all' || categories.indexOf(filter) !== -1;
				card.classList.toggle('is-hidden', !visible);
			});
		}

		function scrollToFeatured(index) {
			if (!track || !featuredCards.length) {
				return;
			}

			activeIndex = Math.max(0, Math.min(index, featuredCards.length - 1));
			var target = featuredCards[activeIndex];
			track.scrollTo({
				left: target.offsetLeft - track.offsetLeft,
				behavior: 'smooth'
			});

			dots.forEach(function (dot, dotIndex) {
				dot.classList.toggle('is-active', dotIndex === activeIndex);
			});
		}

		filters.forEach(function (button) {
			button.addEventListener('click', function () {
				applyFilter(button.dataset.filter || 'all');
			});
		});

		if (prevBtn) {
			prevBtn.addEventListener('click', function () {
				scrollToFeatured(activeIndex - 1);
			});
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', function () {
				scrollToFeatured(activeIndex + 1);
			});
		}

		dots.forEach(function (dot, index) {
			dot.addEventListener('click', function () {
				scrollToFeatured(index);
			});
		});

		if (track) {
			track.addEventListener(
				'scroll',
				function () {
					var closestIndex = 0;
					var closestDistance = Infinity;

					featuredCards.forEach(function (card, index) {
						var distance = Math.abs(track.scrollLeft - (card.offsetLeft - track.offsetLeft));
						if (distance < closestDistance) {
							closestDistance = distance;
							closestIndex = index;
						}
					});

					activeIndex = closestIndex;
					dots.forEach(function (dot, dotIndex) {
						dot.classList.toggle('is-active', dotIndex === activeIndex);
					});
				},
				{ passive: true }
			);
		}

		board.querySelectorAll('.job-featured__skills, .job-card__skills').forEach(function (list) {
			list.querySelectorAll('li').forEach(function (item) {
				if (!item.querySelector('svg')) {
					item.insertAdjacentHTML('afterbegin', checkIcon);
				}
			});
		});

		applyFilter('all');
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initJobBoard);
	} else {
		initJobBoard();
	}
})();
