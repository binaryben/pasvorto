import Conf from 'conf'
import { Pasvorto } from '.'

console.clear()

const config: Conf<{
	randomAPIKey: {
		type: 'string',
    required: true
	}
}> = new Conf()

let randomAPIKey: string = ''

if (config.get('randomAPIKey') === undefined) {
  console.log('Not ready')
} else {
  randomAPIKey = config.get('randomAPIKey').toString()
}

const password = new Pasvorto(randomAPIKey)
