import { tr } from './tr'
import { en } from './en'
import type { UiLanguage } from '../constants'
import type { Translations } from './types'

export type { Translations }

const translations: Record<UiLanguage, Translations> = { tr, en }

export function getTranslations(lang: UiLanguage): Translations {
  return translations[lang] ?? translations.tr
}

export { tr, en }
