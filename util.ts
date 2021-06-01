import { exec } from 'child_process'
import * as http from 'http'
import * as fs from 'fs'

// Generates a random id

export const randomID = () => {
	const alphabet = '0123456789ABCDEF'
	const randomLetter = () => alphabet[Math.floor(Math.random() * alphabet.length)]

	let id = ''

	for (let i = 0; i < 32; i++) {
		id += randomLetter()
	}

	return id
}

// Reads a JSON file

export const readJSON = (path: string) => {
	return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

// Parses a JSON request body

export const parseJSONBody = (
	req: http.IncomingMessage
) => new Promise<any>((resolve, reject) => {
	let json = ''

	req.on('data', chunk => json += chunk)

	req.on('end', () => {
		if (json == '') resolve(null)

		try {
			resolve(JSON.parse(json))
		} catch {
			reject()
		}
	})

	req.on('error', reject)
})

// Executes a command

interface ExecutedCommand {
	stdout: string
	stderr: string
}

export const executeCommand = (
	command: string
) => new Promise<ExecutedCommand>((resolve, reject) => {
	exec(command, (err, stdout, stderr) => {
		if (err) return reject(err)
		resolve({ stdout, stderr })
	})
})