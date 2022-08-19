// import CryptoRandom from 'crypto-random'
import RandomAPI from 'random-org'
import ncp from 'copy-paste'
import { pwnedPassword } from 'hibp'
import zxcvbn from 'zxcvbn'
import { lookup } from './lists'

export class Pasvorto {
  private _random: RandomAPI

  private _wordlist: string | false = false
  private _numbers: string | false = false
  private _password: string | false = false
  private _validated: boolean = false

  private _runners: number = 0 // So I can block new actions when old ones are still running

  private _config: {
    wordcount: number
    seperator: string
    // language: 'en' | 'sp'
    requiredStrength: 3 | 4
    debug: boolean
  }

  constructor(randomAPIKey: string, n: number = 5, autogenerate: boolean = true) {
    this._random = new RandomAPI({ apiKey: randomAPIKey })
    // Laying groundwork in case I can be arsed to make it more configurable, but TBH: YAGNI
    this._config = {
      wordcount: n,
      seperator: '-',
      // language: 'en',
      requiredStrength: 4, // Seems pointless as it's almost guaranteed to be a 4, but anyway...
      debug: false,
    }

    if (this._config.debug) {
      console.log(`\nWARNING: Running in debug mode. DO NOT use any passwords from this session.\n`)
    }

    if (autogenerate) this.generate()

    // console.log(enEFF)
  }

  private _getWord = () => {
    this._debug("generator:words", "Simulating rolling a d6 five times to generate a word")
    this._runners++
    return this._random
      .generateIntegers({ min: 1, max: 6, n: 5 })
      .then((result: {
        random: {
          data: number[]
        }
      }) => {
        const rolled = +(result.random.data.join(""))
        this._runners--
        this._debug("generator:words", `Rolled ${rolled}`)

        let word: string = lookup('en', rolled)
        word = word[0].toUpperCase() + word.substring(1)
        return word
      })
      .catch((err: any) => {
        this._runners--
        this._debug("generator:words", `Something wrong: ${err}`)
      })
  }

  private _simpleOrdinalConvertor = (n: number) => {
    // Works for up to 20 words. TODO: Ensure this can only be configured for max 20 words
    let ordinal = 'th'
    ordinal = n === 1 ? 'st' : ordinal
    ordinal = n === 2 ? 'nd' : ordinal
    ordinal = n === 3 ? 'rd' : ordinal
    return `${n}${ordinal}`
  }

  private _createWordList = () => {
    this._debug("generator:words", "Starting to generate word list")
    let list: string[] = []
    const n = this._config.wordcount
    
    this._debug("generator:words", `Requesting ${n} word seeds from the Random.org API`)
    for (let i = 0; i < n; i++) {
      this._runners++
      this._getWord().then((result) => {
        if (result) {
          list.push(result)
          const currentWord = list.length
          const humanWordCount = currentWord === n
          ? 'last'
          : this._simpleOrdinalConvertor(currentWord)
          this._debug("generator:words", `Got the ${humanWordCount} word: ${result}!`)
          this._runners--
          if (currentWord === n) {
            this._debug("generator:words", `Building the wordlist string from retreived words`)
            this._wordlist = list.join(this._config.seperator)

            this._debug("generator:words", 'Calling save() in case number generator is also done')
            this.save()
          }
        }
      })
    }
  }

  private _createNumSuffix = () => {
    this._debug("generator:number", "Starting to generate number suffix")
    this._runners++
    this._random
      .generateIntegers({ min: 0, max: 9999, n: 1 })
      .then(result => {
        const n = result.random.data[0].toString().padStart(4, "0")
        this._debug("generator:number", `Suffix obtained: ${n}`)
        this._numbers = n
        this._runners--
          
        this._debug("generator:number", 'Calling save() in case wordlist generator is also done')
        this.save()
      })
      .catch(err => {
        this._debug("generator:number", `Something wrong: ${err}`)
        this._runners--
      })
  }
  
  // Super basic console logging for debugging
  private _debug = (scope: string, msg: string) => {
    if (this._config.debug) console.log(`${scope}: ${msg}`)
  }
  
  private _pwnageTesting = () => {
    this._runners++
    this._debug("generator:number", `Checking hash of saved password against HIBP API`)
    return pwnedPassword(this._password.toString())
    .then((pwned: number) => {
        this._runners--
        return pwned > 0
      })
      .catch(err => {
        this._runners--
        console.log(err)
        return true
      })
  }

  save = (password?: string) => {
    if (!password && this._runners)
      this._debug('generator', `Autogeneration not finished. ${this._runners} action(s) are still pending.`)
    if (!password && !this._runners && this._wordlist && this._numbers) {
      this._password = this._wordlist + this._config.seperator + this._numbers
      this._debug('generator', `Autogenerated password saved. Beginning validation steps...`)
      this.validate()
    }
  }

  generate = () => {
    if ( this._wordlist || this._numbers || this._validated ) {
      this._debug("generator", "Clearing existing data")

      this._wordlist = false
      this._numbers = false
      this._validated = false
    }
    else this._debug("generator", "Generating first password")

    this._createWordList()
    this._createNumSuffix()
  }

  validate = () => {
    this._debug("validator:penetration", "Running penetration test...")
    this._runners++
    const penetrationTest = zxcvbn(this._password.toString()).score >= this._config.requiredStrength
    this._runners--
    this._debug("validator:penetration", `Test ${penetrationTest ? 'passed' : 'failed'} (Level ${this._config.requiredStrength})`)
    
    this._pwnageTesting()
      .then(result => {
        this._debug("validator:pwned", `Pwned: ${result}`)
        ncp.copy(this._password.toString(), () => {
          console.log('\nNew password successfully copied to your clipboard.')
          console.log('Please paste it into your password manager now.\n')
        })
      })
  }

  get = () => {
    if (
      typeof this._wordlist === 'object'
      && typeof this._numbers === 'string'
      && this._validated
    )
      console.log(this._wordlist)
    else
      console.log("Password isn't ready yet")
  }
}
