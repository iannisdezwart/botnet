import * as http from 'http'
import * as dotenv from 'dotenv'
import { executeCommand, parseJSONBody } from './util'

dotenv.config()

const execute = async (
	req: http.IncomingMessage,
	res: http.ServerResponse
) => {
	// Read the request

	const data = await parseJSONBody(req)

	console.log(data)

	// Check if necessary fields are present

	if (data == null) return
	if (data.command == null) return
	if (typeof data.command != 'string' || data.command == '') return
	if (data.key == null) return

	// Authorise

	if (data.key != process.env['CONTROLLER_KEY']) return

	// Execute the command

	const { stdout, stderr } = await executeCommand(data.command)

	console.log('finished /execute:', { stdout, stderr })

	// Send the result to the server

	res.end(JSON.stringify({ stdout, stderr }))
}

const ping = (res: http.ServerResponse) => res.end('pong')

const server = http.createServer((req, res) => {
	console.log(`got request to ${ req.url }`)

	// Route the request

	if (req.url == '/execute') {
		execute(req, res)
	}

	else if (req.url == '/ping') {
		ping(res)
	}
})

server.listen(+process.env['WORKER_PRIVATE_PORT'])