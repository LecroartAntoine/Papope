import { translations } from './translations';

export type Language = 'en' | 'fr';

export const defaultLanguage: Language = 'en';

export const supportedLanguages: Language[] = ['en', 'fr'];

export { translations };

/**
 * Get a translation value using dot-notation key.
 * Supports template interpolation with {variable} syntax.
 *
 * @example
 * getTranslation('keeppushing.nutrition.addSupplement', 'en')
 * getTranslation('homepage.accessLimited', 'en', { n: '5' })
 */
export function getTranslation(
  key: string,
  language: Language,
  variables?: Record<string, string | number>
): string {
  const parts = key.split('.');
  let value: any = (translations as any)[language];

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      console.warn(`Translation key not found: ${key} (${language})`);
      return key; // Fallback to key itself
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key} (${language})`);
    return key;
  }

  // Interpolate variables
  if (variables) {
    let result = value;
    for (const [varName, varValue] of Object.entries(variables)) {
      result = result.replace(`{${varName}}`, String(varValue));
    }
    return result;
  }

  return value;
}

/**
 * Type-safe key extractor. Use this to ensure keys exist at compile time.
 * (In a real app, you might use a code generator to create this automatically.)
 */
export const translationKeys = {
  common: {
    logout: 'common.logout',
    close: 'common.close',
    edit: 'common.edit',
    clear: 'common.clear',
    save: 'common.save',
    cancel: 'common.cancel',
    delete: 'common.delete',
    add: 'common.add',
    loading: 'common.loading',
    error: 'common.error',
    success: 'common.success',
    backToHome: 'common.backToHome',
  },
  homepage: {
    oracleTitle: 'homepage.oracleTitle',
    oracleDescription: 'homepage.oracleDescription',
    keeppushingTitle: 'homepage.keeppushingTitle',
    keeppushingDescription: 'homepage.keeppushingDescription',
    ionickelTitle: 'homepage.ionickelTitle',
    ionickelDescription: 'homepage.ionickelDescription',
    chronicleTitle: 'homepage.chronicleTitle',
    chronicleDescription: 'homepage.chronicleDescription',
    gamesTitle: 'homepage.gamesTitle',
    gamesDescription: 'homepage.gamesDescription',
    private: 'homepage.private',
    accessLimited: 'homepage.accessLimited',
    footer: 'homepage.footer',
  },
  login: {
    invalidCredentials: 'login.invalidCredentials',
    signIn: 'login.signIn',
    backToHome: 'login.backToHome',
  },
  admin: {
    title: 'admin.title',
    subtitle: 'admin.subtitle',
    users: 'admin.users',
    activities: 'admin.activities',
    data: 'admin.data',
  },
  keeppushing: {
    title: 'keeppushing.title',
    emptyDay: 'keeppushing.emptyDay',
    nutrition: 'keeppushing.nutrition',
    progress: 'keeppushing.progress',
    saving: 'keeppushing.saving',
  },
  errors: {
    unauthorized: 'errors.unauthorized',
    notFound: 'errors.notFound',
    serverError: 'errors.serverError',
  },
} as const;
