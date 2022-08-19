import Conf from 'conf'
import { Pasvorto } from '.'

const config: Conf<{
	randomAPIKey: {
		type: 'string',
    required: true
	}
}> = new Conf()

let randomAPIKey: string

if (config.get('randomAPIKey') === undefined) {
  console.log('Please manually store the Random.org API key where Conf can find it.')
} else {
  randomAPIKey = config.get('randomAPIKey').toString()
  const password = new Pasvorto(randomAPIKey)
}
