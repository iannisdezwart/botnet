import * as http from 'http'
import * as dotenv from 'dotenv'
import { parseJSONBody, readJSON } from './util'

dotenv.config()

const workerIPs = readJSON('worker-ips.json') as string[]

interface BroadcastResult {
	ip: string
	data: any
}

const broadcast = (
	route: string,
	data: any
) => new Promise<BroadcastResult[]>((resolve) => {
	const results: BroadcastResult[] = []
	let finished = 0

	for (const ip of workerIPs) {
		// Send a request to each worker
		// Todo: secure and use public port

		const req = http.request({
			hostname: ip,
			port: process.env['WORKER_PRIVATE_PORT'],
			path: route,
			method: 'POST'
		}, async (res) => {
			// Decode the response and add it to the results array

			const data = await parseJSONBody(res)
			results.push({ ip, data })

			finished++

			// Resolve when all workers responded

			if (finished == workerIPs.length) {
				resolve(results)
			}
		})

		req.end(JSON.stringify(data))
	}
})

const broadcastExecute = async (command: string) => {
	const key = process.env['CONTROLLER_KEY']

	return await broadcast('/execute', { command, key })
}

broadcastExecute('echo Hello, World!')
	.then(val => {
		console.log(val)
	})

// const server = http.createServer((req, res) => {
	
// })

// server.listen(+process.env['CONTROLLER_PRIVATE_PORT'])