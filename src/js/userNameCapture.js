const UserID = document.getElementById('txtLogin')
const loginButton = document.getElementById('imgbtnLogin')

window.addEventListener('beforeunload', (event) => {
	saveUserName(UserID.value)
});

function saveUserName(userName) {
	chrome.storage.local.set({ "userName": userName }, function () {
	});

}

