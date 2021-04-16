import { socket } from '../main.js';
import { storageAvailable } from './keySettings.js'; // Move this away

const username = { id: '' };
const chatBox = document.getElementById('chatbox');
const userNameInput = document.getElementById('userName');
const input = document.getElementById('text');
const button = document.getElementById('send');
const titleBar = document.getElementById('chatTitleBar');
const chatContents = document.getElementById('chatContents');
const minimizeButton = document.querySelector('.MinimizeButton');

/* UI */

const toggleChatSize = () => {
	chatBox.classList.toggle('minimized');
	chatBox.classList.toggle('resizeable');
}
const scrollToBottom = () => {
	const shouldScroll = chatContents.scrollTop + chatContents.clientHeight === chatContents.scrollHeight;
	if(!shouldScroll) chatContents.scrollTop = chatContents.scrollHeight;
}
/* init */
export const initChatbox = () => {
	
	/* load previous inputs */
	if (storageAvailable()) {
		let load = localStorage['username'];
		if (load) userNameInput.value = load;
	}
	username.id = userNameInput.value;

	/* Make Chat Resizeable */
	minimizeButton.addEventListener('click',toggleChatSize);
	
	/* Make Chatbox Draggable  */
	const moveChat = (e) => {
		minimizeButton.removeEventListener('mouseup',toggleChatSize);
		
		let sx = e.clientX - chatBox.getBoundingClientRect().left;
		let sy = e.clientY - chatBox.getBoundingClientRect().top;
		
		const move = (e) => {
			chatBox.style.left = e.pageX - sx + 'px';
			chatBox.style.top = e.pageY - sy + 'px';
		};
		const onMouseMove = (e) => move(e);
		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			titleBar.removeEventListener('mouseup', onMouseUp);
			minimizeButton.addEventListener('mouseup',toggleChatSize);
		};

		document.addEventListener('mousemove', onMouseMove);
		titleBar.addEventListener('mouseup', onMouseUp);
	};
	
	/* Chat Related Stuffs */
	const send = () => {
		let text = input.value;
		input.value = '';
		socket.emit('chatMessage', { id: username.id, text });
	};
	const changeName = () => {
		let prev = username.id;
		username.id = userNameInput.value;
		if(storageAvailable()) localStorage['username'] = username.id;
		socket.emit('changedUsername', { prev, id: username.id });
	};
	const addChatContent = (p) => {
		chatContents.innerHTML += p;
		scrollToBottom();
	};
	const executeNotification = (content) => {
		let text;
		let code = content.code;
		let data = content.data;
		switch (code) {
			case 'roomNotFound':
				text = "Your text was not sent because you haven't joined any room yet.";
				break;
			case 'changedUsername':
				if (data) text = `${data.prev} has changed the username to ${data.id}.`;
				break;
			default:
				break;
		}
		if (text) addNotification(text);
	};
	const addMessage = (data) => {
		let id = data.id;
		let opp = username.id == id ? 'self' : 'opponent';
		let p = `<p class='chat ${opp}'>[${id}\]:${data.text} </p>`;
		addChatContent(p);
	};
	const addNotification = (text) => {
		let p = "<p class='chat notification'>" + text + '</p>';
		addChatContent(p);
	};

	titleBar.addEventListener('mousedown', moveChat);
	titleBar.ondragstart = () => {return false;};

	userNameInput.addEventListener('focusout', changeName);
	button.addEventListener('mousedown', send);
	input.addEventListener('keydown', (e) => {
		if (e.key == 'Enter') send();
	});

	socket.on('chatMessage', addMessage);
	socket.on('notification', executeNotification);
};