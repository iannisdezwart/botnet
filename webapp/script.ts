const socket = io.connect('/')

const getKey = () => prompt('Enter key')

const executeCommand = () => {
	const command = document.querySelector<HTMLTextAreaElement>('#command').value
	const key = getKey()

	socket.emit('execute-command', { command, key })
}

socket.on('worker-res', data => {
	console.log('worker-res', data)
})