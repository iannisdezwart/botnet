import * as http from 'http'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import { parseJSONBody, readJSON } from './util'
import * as socketIO from 'socket.io'

dotenv.config()

const workerIPs = readJSON('worker-ips.json') as string[]

interface BroadcastResult {
	ip: string
	data: any
}

const broadcast = (
	route: string,
	data: any,
	callback: (res: BroadcastResult) => void
) => {
	for (const ip of workerIPs) {
		// Send a request to each worker
		// Todo: secure and use public port

		const req = http.request({
			hostname: ip,
			port: process.env['WORKER_PRIVATE_PORT'],
			path: route,
			method: 'POST'
		}, async (res) => {
			// Decode the response and yield the result

			const data = await parseJSONBody(res)
			callback({ ip, data })
		})

		req.end(JSON.stringify(data))
	}
}

const broadcastExecute = async (command: string, socket: socketIO.Socket) => {
	const key = process.env['CONTROLLER_KEY']

	broadcast('/execute', { command, key }, workerRes => {
		console.log('broadcastExecute() worker finished:', workerRes)
		socket.emit('worker-res', workerRes)
	})
}

const server = http.createServer(async (req, res) => {
	// Send the webapp

	if (req.url == '/') {
		console.log('Request to /, sending webapp page')

		fs.createReadStream('webapp/index.html').pipe(res)
		return
	}

	// Send webapp script

	if (req.url == '/script') {
		console.log('Request to /script, sending webapp js file')

		fs.createReadStream('webapp/script.js').pipe(res)
		return
	}
})

const io = new socketIO.Server(server)

io.on('connection', socket => {
	// Webapp API: execute command

	socket.on('execute-command', data => {
		// Authorise

		if (data.key != process.env['CONTROLLER_KEY']) return

		// Execute command and keep the webapp up to date with output

		console.log('Request to /execute-command:', data)

		broadcastExecute(data.command, socket)
		return
	})
})

server.listen(+process.env['CONTROLLER_PRIVATE_PORT'])