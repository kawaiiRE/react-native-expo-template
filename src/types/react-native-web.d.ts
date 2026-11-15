import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    /** react-native-web only: the HTML `dir` attribute, which also scopes the locale direction. */
    dir?: 'ltr' | 'rtl' | 'auto';
  }
}
