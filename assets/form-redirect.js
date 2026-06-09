(function () {
	var THANK_YOU_URL = '/thank-you/';

	function getApplyForm() {
		return document.querySelector('.elementor-form[data-form-id="9ee676b"]')
			|| document.querySelector('.elementor-element-9ee676b .elementor-form')
			|| document.querySelector('#apply .elementor-form');
	}

	function isFormValid(form) {
		if (!form.checkValidity()) {
			form.reportValidity();
			return false;
		}

		return true;
	}

	function redirectToThankYou() {
		window.location.href = THANK_YOU_URL;
	}

	function initFormRedirect() {
		var form = getApplyForm();
		if (!form || form.dataset.thankYouBound === 'true') {
			return;
		}

		form.dataset.thankYouBound = 'true';

		form.addEventListener('submit', function (event) {
			if (!isFormValid(form)) {
				return;
			}

			event.preventDefault();
			event.stopImmediatePropagation();
			redirectToThankYou();
		}, true);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initFormRedirect);
	} else {
		initFormRedirect();
	}
})();
