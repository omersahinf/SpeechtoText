import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type ReactElement
} from 'react'
import type { Translations } from '@/shared/i18n/types'
import { getTranslations } from '@/shared/i18n'
import type { UiLanguage } from '@/shared/types'

interface I18nContextValue {
  t: Translations
  lang: UiLanguage
  setLang: (lang: UiLanguage) => void
}

const I18nContext = createContext<I18nContextValue>({
  t: getTranslations('tr'),
  lang: 'tr',
  setLang: () => {}
})

export function I18nProvider({ children }: { children: ReactNode }): ReactElement {
  const [lang, setLangState] = useState<UiLanguage>('tr')
  const [t, setT] = useState<Translations>(getTranslations('tr'))

  useEffect(() => {
    void window.api.settings.get().then((s) => {
      const l = (s.uiLanguage as UiLanguage | undefined) ?? 'tr'
      setLangState(l)
      setT(getTranslations(l))
    })
  }, [])

  const setLang = (nextLang: UiLanguage): void => {
    setLangState(nextLang)
    setT(getTranslations(nextLang))
  }

  return <I18nContext.Provider value={{ t, lang, setLang }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}
