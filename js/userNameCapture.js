let UserID = document.getElementById('txtLogin')
let loginButton = document.getElementById('imgbtnLogin')
loginButton.addEventListener("click", saveUserName(UserID.value));

function saveUserName(userName) {
	chrome.storage.local.set({"userName": userName }, function(){	
	});
	
}