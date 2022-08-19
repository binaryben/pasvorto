import { en } from './en'

export interface Wordlist {
  [key: number]: string
}

export const lookup = (list: string, word: number): string => {
  if (list === 'en') {
    return en[word]
  }
  else return 'bird'
}
