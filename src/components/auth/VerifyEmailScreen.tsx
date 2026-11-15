import { router, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Button } from 'react-native-paper';

import FormBanner from '@/components/ui/FormBanner';
import { routes } from '@/constants/routes';
import type { AppError } from '@/models/errors';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { useServices, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes } from '@/theme/tokens';

import AuthLayout from './AuthLayout';

type LinkState =
  | { status: 'verifying' }
  | { status: 'verified' }
  | { status: 'failed'; error: AppError };

/**
 * Two entry points: the "check your inbox" notice after registration
 * (`?email=`), and the emailed verification link (`?token=`).
 */
export default observer(function VerifyEmailScreen() {
  const { email, token } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();

  return token ? (
    <VerificationLink token={token} />
  ) : (
    <VerificationNotice email={email} />
  );
});

const VerificationLink = observer(function VerificationLink({
  token,
}: {
  token: string;
}) {
  const { auth } = useServices();
  const session = useSession();
  const { t } = useTranslation();
  const styles = useStyles();
  const [state, setState] = useState<LinkState>({ status: 'verifying' });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void auth.verifyEmail(token).then(async (result) => {
      if (!result.ok) {
        haptics.error();
        setState({ status: 'failed', error: result.error });
        return;
      }
      if (result.data.user) await session.completeSignIn(result.data.user);
      else if (session.isSignedIn) await session.refresh();
      haptics.success();
      setState({ status: 'verified' });
    });
  }, [auth, session, token]);

  if (state.status === 'verifying') {
    return (
      <AuthLayout
        icon="email-sync-outline"
        subtitle={t('auth.verify.verifyingBody')}
        title={t('auth.verify.verifying')}
      >
        <ActivityIndicator accessibilityLabel={t('a11y.loading')} />
      </AuthLayout>
    );
  }

  if (state.status === 'failed') {
    return (
      <AuthLayout
        icon="email-alert-outline"
        subtitle={t('auth.verify.failedBody')}
        title={t('auth.verify.failedTitle')}
      >
        <FormBanner message={t(errorMessageKey(state.error))} />
        <Button
          contentStyle={styles.buttonContent}
          mode="contained"
          onPress={() =>
            router.replace(session.isSignedIn ? routes.home : routes.login)
          }
        >
          {session.isSignedIn
            ? t('common.continue')
            : t('auth.verify.backToSignIn')}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon="email-check-outline"
      subtitle={
        session.isSignedIn
          ? t('auth.verify.verifiedBodySignedIn')
          : t('auth.verify.verifiedBody')
      }
      title={t('auth.verify.verifiedTitle')}
    >
      <Button
        contentStyle={styles.buttonContent}
        mode="contained"
        onPress={() =>
          router.replace(session.isSignedIn ? routes.home : routes.login)
        }
      >
        {session.isSignedIn ? t('common.continue') : t('auth.verify.signIn')}
      </Button>
    </AuthLayout>
  );
});

const VerificationNotice = observer(function VerificationNotice({
  email,
}: {
  email?: string;
}) {
  const { auth } = useServices();
  const session = useSession();
  const { t } = useTranslation();
  const styles = useStyles();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canResend = Boolean(email) && auth.capabilities.resendVerification;

  async function resend() {
    if (!email) return;
    setSending(true);
    setError(null);
    const result = await auth.resendVerification({ email });
    setSending(false);

    if (!result.ok) {
      haptics.error();
      setError(t(errorMessageKey(result.error)));
      return;
    }
    haptics.success();
    setSent(true);
  }

  return (
    <AuthLayout
      icon="email-fast-outline"
      subtitle={
        email ? t('auth.verify.body', { email }) : t('auth.verify.bodyNoEmail')
      }
      title={t('auth.verify.title')}
    >
      <FormBanner message={error} />
      <FormBanner
        message={sent ? t('auth.verify.resent') : null}
        tone="success"
      />
      {canResend ? (
        <Button
          contentStyle={styles.buttonContent}
          disabled={sending || sent}
          icon="email-sync-outline"
          loading={sending}
          mode="outlined"
          onPress={() => void resend()}
        >
          {t('auth.verify.resend')}
        </Button>
      ) : (
        <FormBanner message={t('auth.verify.noResend')} tone="info" />
      )}
      <Button
        contentStyle={styles.buttonContent}
        mode="contained"
        onPress={() =>
          session.isSignedIn ? router.back() : router.replace(routes.login)
        }
      >
        {session.isSignedIn ? t('common.done') : t('auth.verify.backToSignIn')}
      </Button>
    </AuthLayout>
  );
});

const useStyles = makeStyles(() => ({
  buttonContent: {
    minHeight: sizes.touchTarget + 4,
  },
}));
